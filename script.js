const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
const SECRET_KEY = "mySuperSecretKey123";

// XOR-based encryption
function encrypt(message, key) {
  return btoa(message.split('').map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join(''));
}

function decrypt(encrypted, key) {
  return atob(encrypted).split('').map((char, i) =>
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
  } else {
    alert("Please enter both username and room name.");
  }
}

function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg && room && username) {
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

// Receiving messages
socket.on("receive_message", (payload) => {
  console.log("📦 Received payload:", payload);

  if (!payload || !payload.encryptedMessage || !payload.sender) {
    appendMessage("⚠️ Received a malformed message.");
    return;
  }

  try {
    const decrypted = decrypt(payload.encryptedMessage, SECRET_KEY);
    appendMessage(`🧑 ${payload.sender}: ${decrypted}`);
  } catch (err) {
    console.error("❌ Decryption error:", err);
    appendMessage(`⚠️ Could not decrypt message from ${payload.sender || "unknown"}`);
  }
});

function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
