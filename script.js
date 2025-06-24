const socket = io("https://private-room-chat-server.onrender.com", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});

let room = "";
let username = "";
let SECRET_KEY = "";
let isConnected = false;

// Improved room joining with status tracking
function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  username = document.getElementById("usernameInput").value.trim();
  SECRET_KEY = document.getElementById("secretKeyInput").value.trim();

  if (!room || !username || !SECRET_KEY) {
    alert("Please enter your name, room, and secret key.");
    return;
  }

  // Show connection status
  appendMessage("⌛ Connecting to room...");
  
  socket.emit("join_room", {
    room: room,
    username: username,
    secretKey: SECRET_KEY
  }, (response) => {
    if (response.success) {
      isConnected = true;
      document.getElementById("chatArea").style.display = "block";
      appendMessage(`✅ You (${username}) joined room: ${room}`);
      appendMessage(`🔑 Using secret key: ${'*'.repeat(SECRET_KEY.length)}`);
    } else {
      appendMessage(`❌ Failed to join room: ${response.error || "Unknown error"}`);
    }
  });
}

// Server communication handlers
socket.on("connect", () => {
  appendMessage("🌐 Connected to server");
  if (room && !isConnected) {
    joinRoom(); // Rejoin if we were in a room
  }
});

socket.on("disconnect", () => {
  isConnected = false;
  appendMessage("⚠️ Disconnected from server");
});

socket.on("user_joined", (username) => {
  appendMessage(`👋 ${username} joined the room`);
});

socket.on("user_left", (username) => {
  appendMessage(`🚪 ${username} left the room`);
});

socket.on("room_error", (error) => {
  appendMessage(`❌ Room error: ${error}`);
});

// Rest of your existing functions (sendMessage, encrypt, decrypt, etc.) remain the same
// but with the improved implementations we discussed earlier