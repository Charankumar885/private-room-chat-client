// Connect to the backend Socket.IO server
const socket = io("https://private-room-chat-server.onrender.com");

// Variables
let room = "";
const SECRET_KEY = "mySuperSecretKey123"; // Must match client/server

// 🔐 Encrypt message using XOR + base64
function encrypt(message, key) {
  return btoa(
    message
      .split("")
      .map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      )
      .join("")
  );
}

// 🔓 Decrypt using same method
function decrypt(encrypted, key) {
  return atob(encrypted)
    .split("")
    .map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    )
    .join("");
}

// 🟢 Join Room
function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  if (room !== "") {
    socket.emit("join_room", room);
    document.getElementById("chatArea").style.display = "block";
    appendMessage(`✅ Joined room ${room}`);
  }
}

// 📤 Send Encrypted Message
function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg !== "") {
    const encrypted = encrypt(msg, SECRET_KEY);
    socket.emit("send_message", { room, encryptedMessage: encrypted });

    appendMessage("🧑 You: " + msg);
    document.getElementById("messageInput").value = "";
  }
}

// 📥 Receive Encrypted Message
socket.on("receive_message", (encryptedMessage) => {
  const decrypted = decrypt(encryptedMessage, SECRET_KEY);
  appendMessage("👤 Stranger: " + decrypted);
});

// 🧹 Clear Messages
function clearMessages() {
  document.getElementById("messages").innerHTML = "";
}

// 🚪 Leave Room
function leaveRoom() {
  socket.emit("leave_room", room);
  document.getElementById("chatArea").style.display = "none";
  appendMessage("🚪 You left the room.");
}

// ➕ Append Message to Chat Box
function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
