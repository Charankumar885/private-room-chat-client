const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
let SECRET_KEY = "";

// 🔐 XOR-based encryption with URI encoding
function encrypt(message, key) {
  const xorResult = message
    .split("")
    .map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    )
    .join("");
  return btoa(encodeURIComponent(xorResult));
}

// 🔓 XOR-based decryption with URI decoding
function decrypt(encrypted, key) {
  try {
    const decoded = decodeURIComponent(atob(encrypted));
    return decoded
      .split("")
      .map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      )
      .join("");
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    return null;
  }
}

// 👥 Join room
function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  username = document.getElementById("usernameInput").value.trim();
  SECRET_KEY = document.getElementById("secretKeyInput").value.trim();

  if (room && username && SECRET_KEY) {
    socket.emit("join_room", room);
    document.getElementById("chatArea").style.display = "block";
    appendMessage(`✅ You (${username}) joined room: ${room}`);
  } else {
    alert("Please enter your name, room, and secret key.");
  }
}

// 📨 Send message
function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg && room && username && SECRET_KEY) {
    const encrypted = encrypt(msg, SECRET_KEY);
    socket.emit("send_message", {
      room,
      encryptedMessage: encrypted,
      sender: username,
    });

    appendMessage(`🧑 ${username}: ${msg}`);
    document.getElementById("messageInput").value = "";
  }
}

// ❌ Leave room
function leaveRoom() {
  socket.emit("leave_room", room);
  document.getElementById("chatArea").style.display = "none";
  appendMessage("🚪 You left the room.");
}

// 🧹 Clear chat
function clearMessages() {
  document.getElementById("messages").innerHTML = "";
}

// 📩 Receive message
socket.on("receive_message", (payload) => {
  if (!payload || !payload.encryptedMessage || !payload.sender) {
    appendMessage("⚠️ Received a malformed message.");
    return;
  }

  const decrypted = decrypt(payload.encryptedMessage, SECRET_KEY);

  if (decrypted === null) {
    appendMessage(`⚠️ Could not decrypt message from ${payload.sender}`);
  } else {
    appendMessage(`🧑 ${payload.sender}: ${decrypted}`);
  }
});

// 💬 Append to chat box
function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
