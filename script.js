const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
let SECRET_KEY = "";

function encrypt(message, key) {
  const xor = message.split("").map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join("");
  return btoa(unescape(encodeURIComponent(xor))); // Ensure proper base64
}

function decrypt(encrypted, key) {
  const decoded = decodeURIComponent(escape(atob(encrypted))); // Decode safely
  return decoded.split("").map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join("");
}

function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  username = document.getElementById("usernameInput").value.trim();
  SECRET_KEY = document.getElementById("secretKeyInput").value.trim();

  if (room && username && SECRET_KEY) {
    socket.emit("join_room", room);
    document.getElementById("chatArea").style.display = "block";
    appendMessage(`✅ You (${username}) joined room: ${room}`);
  } else {
    alert("Please enter all fields (username, room, secret key)");
  }
}

function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg && room && username && SECRET_KEY) {
    try {
      const encrypted = encrypt(msg, SECRET_KEY);
      socket.emit("send_message", { room, encryptedMessage: encrypted, sender: username });
      appendMessage(`🧑 ${username}: ${msg}`);
      document.getElementById("messageInput").value = "";
    } catch (err) {
      appendMessage("❌ Failed to encrypt message.");
      console.error(err);
    }
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

socket.on("receive_message", (payload) => {
  if (!payload || !payload.encryptedMessage || !payload.sender) {
    appendMessage("⚠️ Received a malformed message.");
    return;
  }

  try {
    const decrypted = decrypt(payload.encryptedMessage, SECRET_KEY);
    appendMessage(`🧑 ${payload.sender}: ${decrypted}`);
  } catch (err) {
    appendMessage(`⚠️ Could not decrypt message from ${payload.sender}`);
    console.error("Decryption error:", err);
  }
});

function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
