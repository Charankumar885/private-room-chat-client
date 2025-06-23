const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
let SECRET_KEY = "";

// XOR encryption
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

// XOR decryption
function decrypt(encrypted, key) {
  return atob(encrypted)
    .split("")
    .map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    )
    .join("");
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
    alert("Please enter your name, room, and secret key.");
  }
}

function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg && room && username && SECRET_KEY) {
    const encrypted = encrypt(msg, SECRET_KEY);
    socket.emit("send_message", {
      room,
      encryptedMessage: encrypted,
      sender: username,
    });
    console.log("🔐 Sent Encrypted:", encrypted);

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

// Receive message
socket.on("receive_message", (payload) => {
  if (!payload || !payload.encryptedMessage || !payload.sender) {
    appendMessage("⚠️ Received a malformed message.");
    return;
  }

  try {
    const decrypted = decrypt(payload.encryptedMessage, SECRET_KEY);
    console.log("📩 Encrypted:", payload.encryptedMessage);
    console.log("🔓 Decrypted:", decrypted);
    appendMessage(`🧑 ${payload.sender}: ${decrypted}`);
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    appendMessage(`⚠️ Could not decrypt message from ${payload.sender}`);
  }
});

function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
