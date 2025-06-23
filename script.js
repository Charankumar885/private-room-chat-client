const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
const SECRET_KEY = "mySuperSecretKey123"; // Must match on both ends

// Secure XOR + Base64 encode
function encrypt(message, key) {
  const xor = [...message].map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');

  return btoa(unescape(encodeURIComponent(xor))); // UTF-8 safe
}

// Secure Base64 decode + XOR
function decrypt(encrypted, key) {
  const decoded = decodeURIComponent(escape(atob(encrypted))); // UTF-8 safe
  return [...decoded].map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  username = document.getElementById("usernameInput").value.trim();

  if (room && username) {
    socket.emit("join_room", room);
    document.getElementById("chatArea").style.display = "block";
    appendMessage(`✅ You (${username}) joined room: ${room}`);
  }
}

function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg !== "") {
    const encrypted = encrypt(msg, SECRET_KEY);
    socket.emit("send_message", { room, encryptedMessage: encrypted, sender: username });
    appendMessage(`🧑 ${username}: ${msg}`);
    document.getElementById("messageInput").value = "";
  }
}

function clearMessages() {
  document.getElementById("messages").innerHTML = "";
}

function leaveRoom() {
  socket.emit("leave_room", room);
  document.getElementById("chatArea").style.display = "none";
  appendMessage("🚪 You left the room.");
}

socket.on("receive_message", ({ encryptedMessage, sender }) => {
  try {
    const decrypted = decrypt(encryptedMessage, SECRET_KEY);
    appendMessage(`🧑 ${sender}: ${decrypted}`);
  } catch (err) {
    console.error("Decryption error:", err);
    appendMessage(`⚠️ Could not decrypt message from ${sender}`);
  }
});

function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
