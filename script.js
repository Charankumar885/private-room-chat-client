const socket = io("https://private-room-chat-server.onrender.com", {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 20000,
  transports: ["websocket"] // Force WebSocket only
});

let currentRoom = "";
let currentUsername = "";
let currentSecretKey = "";

// Connection status indicators
function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connectionStatus');
  if (statusEl) {
    statusEl.textContent = connected ? '🟢 Connected' : '🔴 Disconnected';
    statusEl.style.color = connected ? 'green' : 'red';
  }
}

// Improved room joining
async function joinRoom() {
  const room = document.getElementById("roomInput").value.trim();
  const username = document.getElementById("usernameInput").value.trim();
  const secretKey = document.getElementById("secretKeyInput").value.trim();

  if (!room || !username || !secretKey) {
    alert("Please enter all fields (name, room, and secret key)");
    return;
  }

  // Clear previous connection
  if (currentRoom) {
    socket.emit("leave_room", currentRoom);
  }

  // Store current session
  currentRoom = room;
  currentUsername = username;
  currentSecretKey = secretKey;

  // Show loading state
  const joinBtn = document.querySelector('button[onclick="joinRoom()"]');
  joinBtn.disabled = true;
  joinBtn.textContent = "Connecting...";

  return new Promise((resolve) => {
    socket.emit("join_room", { 
      room, 
      username,
      secretKey 
    }, (response) => {
      joinBtn.disabled = false;
      joinBtn.textContent = "Join Room";
      
      if (response.success) {
        document.getElementById("chatArea").style.display = "block";
        appendMessage(`✅ ${username} joined room: ${room}`);
        updateConnectionStatus(true);
        resolve(true);
      } else {
        appendMessage(`❌ Failed to join: ${response.error || "Server error"}`);
        updateConnectionStatus(false);
        resolve(false);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (joinBtn.disabled) {
        joinBtn.disabled = false;
        joinBtn.textContent = "Join Room";
        appendMessage("⌛ Connection timeout - please try again");
        updateConnectionStatus(false);
        resolve(false);
      }
    }, 10000);
  });
}

// Socket event handlers
socket.on("connect", () => {
  updateConnectionStatus(true);
  appendMessage("🌐 Connected to server");
  
  // Rejoin room if we were in one
  if (currentRoom) {
    appendMessage("♻️ Reconnecting to room...");
    joinRoom();
  }
});

socket.on("disconnect", (reason) => {
  updateConnectionStatus(false);
  appendMessage(`⚠️ Disconnected: ${reason}`);
});

socket.on("connect_error", (err) => {
  updateConnectionStatus(false);
  appendMessage(`⚠️ Connection error: ${err.message}`);
});

socket.on("room_users", (users) => {
  const usersList = document.getElementById("roomUsers");
  if (usersList) {
    usersList.innerHTML = users.map(u => 
      `<li>${u}${u === currentUsername ? ' (You)' : ''}</li>`
    ).join('');
  }
});

// Add this to your HTML or create dynamically
function ensureUIElements() {
  if (!document.getElementById('connectionStatus')) {
    const statusEl = document.createElement('div');
    statusEl.id = 'connectionStatus';
    statusEl.style.margin = '10px 0';
    document.querySelector('.container').prepend(statusEl);
  }
  
  if (!document.getElementById('roomUsers')) {
    const usersEl = document.createElement('div');
    usersEl.id = 'roomUsers';
    usersEl.style.margin = '10px 0';
    document.getElementById('chatArea').prepend(usersEl);
  }
}

// Call this when page loads
ensureUIElements();