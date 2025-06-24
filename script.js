const socket = io("https://private-room-chat-server.onrender.com", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  transports: ["websocket"]
});

let currentRoom = "";
let currentUsername = "";
let currentSecretKey = "";
let isConnected = false;

const connectionStatusEl = document.getElementById("connectionStatus");
const roomDisplayEl = document.getElementById("currentRoomDisplay");

function appendMessage(message, type = "system") {
  const messagesDiv = document.getElementById("messages");
  if (!messagesDiv) return;

  const messageEl = document.createElement("div");
  messageEl.textContent = message;
  messageEl.className = `message ${type}-message`;
  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateConnectionStatus(connected) {
  isConnected = connected;
  connectionStatusEl.textContent = connected ? "🟢 Connected" : "🔴 Disconnected";
  connectionStatusEl.style.color = connected ? "green" : "red";
}

function joinRoom() {
  const room = document.getElementById("roomInput").value.trim();
  const username = document.getElementById("usernameInput").value.trim();
  const secretKey = document.getElementById("secretKeyInput").value.trim();

  if (!room || !username || !secretKey) {
    appendMessage("❗ Please fill in all fields", "error");
    return;
  }

  const joinBtn = document.getElementById("joinBtn");
  joinBtn.disabled = true;
  joinBtn.textContent = "Connecting...";

  currentRoom = room;
  currentUsername = username;
  currentSecretKey = secretKey;

  console.log("📨 Sending join_room event", { room, username });

  socket.emit("join_room", { room, username, secretKey }, (response) => {
    console.log("✅ Received join response:", response);

    joinBtn.disabled = false;
    joinBtn.textContent = "Join Room";

    if (response?.success) {
      document.getElementById("chatArea").style.display = "block";
      document.getElementById("joinForm").style.display = "none";
      roomDisplayEl.textContent = room;
      appendMessage(`✅ Joined room: ${room}`, "system");
      appendMessage(`🔑 Using secret key: ${"•".repeat(secretKey.length)}`, "system");
      updateConnectionStatus(true);
    } else {
      appendMessage(`❌ ${response?.error || "Failed to join room"}`, "error");
      updateConnectionStatus(false);
    }
  });
}

function sendMessage() {
  if (!isConnected) {
    appendMessage("⚠️ Not connected to a room", "error");
    return;
  }

  const message = document.getElementById("messageInput").value.trim();
  if (!message) return;

  const encrypted = encrypt(message, currentSecretKey);
  if (!encrypted) {
    appendMessage("Encryption failed", "error");
    return;
  }

  socket.emit("send_message", {
    room: currentRoom,
    encryptedMessage: encrypted,
    sender: currentUsername
  });

  appendMessage(`${currentUsername}: ${message}`, "user");
  document.getElementById("messageInput").value = "";
}

function encrypt(message, key) {
  try {
    let result = "";
    for (let i = 0; i < message.length; i++) {
      const charCode = message.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(unescape(encodeURIComponent(result)));
  } catch (err) {
    console.error("Encryption error:", err);
    return null;
  }
}

function decrypt(encrypted, key) {
  try {
    const decoded = decodeURIComponent(escape(atob(encrypted)));
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (err) {
    console.error("Decryption error:", err);
    return null;
  }
}

function leaveRoom() {
  if (currentRoom) {
    socket.emit("leave_room", currentRoom);
    document.getElementById("chatArea").style.display = "none";
    document.getElementById("joinForm").style.display = "block";
    appendMessage(`🚪 You left room: ${currentRoom}`, "system");
    currentRoom = "";
    updateConnectionStatus(false);
  }
}

function clearMessages() {
  document.getElementById("messages").innerHTML = "";
}

socket.on("connect", () => {
  updateConnectionStatus(true);
  appendMessage("🌐 Connected to server", "system");
});

socket.on("disconnect", () => {
  updateConnectionStatus(false);
  appendMessage("⚠️ Disconnected from server", "error");
});

socket.on("connect_error", (err) => {
  updateConnectionStatus(false);
  appendMessage(`⚠️ Connection error: ${err.message}`, "error");
});

socket.on("receive_message", (data) => {
  if (!data || !data.encryptedMessage || !data.sender) {
    appendMessage("⚠️ Received malformed message", "error");
    return;
  }

  if (data.sender === currentUsername) return;

  const decrypted = decrypt(data.encryptedMessage, currentSecretKey);
  if (decrypted) {
    appendMessage(`${data.sender}: ${decrypted}`, "user");
  } else {
    appendMessage(`⚠️ Could not decrypt message from ${data.sender}`, "error");
  }
});

socket.on("user_joined", (username) => {
  if (username !== currentUsername) {
    appendMessage(`👋 ${username} joined the room`, "system");
  }
});

socket.on("user_left", (username) => {
  appendMessage(`🚪 ${username} left the room`, "system");
});

socket.on("room_users", (users) => {
  const usersList = document.getElementById("roomUsers");
  if (usersList) {
    usersList.innerHTML = "<h4>Users in room:</h4>" +
      users.map(user => `<li>${user}${user === currentUsername ? ' (You)' : ''}</li>`).join('');
  }
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 DOM fully loaded");

  const joinForm = document.getElementById("joinForm");
  joinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    console.log("📥 Join button clicked");
    joinRoom();
  });

  document.getElementById("chatArea").style.display = "none";
});
