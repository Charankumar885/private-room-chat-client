const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
const SECRET_KEY = "mySuperSecretKey123"; // Same key for all users

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
  const decrypted = decrypt(encryptedMessage, SECRET_KEY);
  appendMessage(`🧑 ${sender}: ${decrypted}`);
});

function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
