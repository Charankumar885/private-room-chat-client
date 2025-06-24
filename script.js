const socket = io("https://private-room-chat-server.onrender.com", {
  reconnection: true,
  transports: ["websocket"]
});

let currentRoom = "", currentUsername = "", currentSecretKey = "";
let isConnected = false;

// DOM Refs
const statusEl = document.getElementById("connectionStatus");
const loginArea = document.getElementById("loginArea");
const chatArea = document.getElementById("chatArea");
const roomDisplayEl = document.getElementById("currentRoomDisplay");

// Append message utility
function appendMessage(text, type="system") {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = text;
  msgDiv.className = `message ${type}-message`;
  document.getElementById("messages").appendChild(msgDiv);
  document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
}

// Update status light
function updateConnection(connected) {
  isConnected = connected;
  statusEl.textContent = connected ? "🟢 Connected" : "🔴 Disconnected";
  statusEl.style.color = connected ? "green" : "red";
}

function joinRoom() {
  const room = document.getElementById("roomInput").value.trim();
  const user = document.getElementById("usernameInput").value.trim();
  const secret = document.getElementById("secretKeyInput").value.trim();
  if (!room || !user || !secret) {
    appendMessage("❌ All fields are required", "error");
    return;
  }

  document.getElementById("joinButton").disabled = true;
  document.getElementById("joinButton").textContent = "Joining...";

  currentRoom = room;
  currentUsername = user;
  currentSecretKey = secret;

  socket.emit("join_room", {room, username: user, secretKey: secret}, (res) => {
    document.getElementById("joinButton").disabled = false;
    document.getElementById("joinButton").textContent = "Join Room";
    if (res.success) {
      loginArea.style.display = "none";
      chatArea.style.display = "block";
      roomDisplayEl.textContent = room;
      appendMessage(`✅ Joined room "${room}"`, "system");
      appendMessage(`🔑 Secret key is set`, "system");
      updateConnection(true);

      // Show list of users on join
      if (res.users) socket.emit("room_users", currentRoom);
    } else {
      appendMessage(`❌ ${res.error}`, "error");
      updateConnection(false);
    }
  });
}

function sendMessage() {
  if (!isConnected) { appendMessage("⚠️ Not connected", "error"); return; }
  const msg = document.getElementById("messageInput").value.trim();
  if (!msg) return;

  const enc = btoa(unescape(encodeURIComponent(xor(msg, currentSecretKey))));
  socket.emit("send_message", {
    room: currentRoom,
    encryptedMessage: enc,
    sender: currentUsername
  });
  appendMessage(`${currentUsername}: ${msg}`, "user");
  document.getElementById("messageInput").value = "";
}

function xor(msg, key) {
  let out = "";
  for (let i = 0; i < msg.length; i++)
    out += String.fromCharCode(msg.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}

function decrypt(enc) {
  try {
    const dec = decodeURIComponent(escape(atob(enc)));
    return xor(dec, currentSecretKey);
  } catch { return null; }
}

function leaveRoom() {
  if (!currentRoom) return;
  socket.emit("leave_room", currentRoom);
  appendMessage(`🚪 Left room "${currentRoom}"`, "system");
  loginArea.style.display = "block";
  chatArea.style.display = "none";
  currentRoom = "";
  updateConnection(false);
}

function clearMessages() {
  document.getElementById("messages").innerHTML = "";
}

// Socket listeners
socket.on("connect", () => appendMessage("🌐 Connected", "system"), updateConnection(true));
socket.on("disconnect", () => appendMessage("🔌 Disconnected", "error"), updateConnection(false));
socket.on("receive_message", (d) => {
  if (d.sender === currentUsername) return;
  if (!d.encryptedMessage || !d.sender) { appendMessage("⚠️ Malformed message", "error"); return; }

  const clear = decrypt(d.encryptedMessage);
  appendMessage(clear ? `${d.sender}: ${clear}` : `⚠️ Failed to decrypt from ${d.sender}`, clear ? "user" : "error");
});
socket.on("user_joined", u => appendMessage(`${u} joined`, "system"));
socket.on("user_left", u => appendMessage(`${u} left`, "system"));
socket.on("room_users", list => {
  document.getElementById("roomUsers").innerHTML = `<h4>Users:</h4>${list.map(u => `<li>${u}${u===currentUsername?" (You)":""}</li>`).join("")}`;
});

// At the end: hide chat on load
document.addEventListener("DOMContentLoaded", () => {
  loginArea.style.display = "block";
  chatArea.style.display = "none";
  updateConnection(false);
});
