const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
let SECRET_KEY = "";

// Improved XOR-based encryption
function encrypt(message, key) {
  if (!message || !key) return null;
  
  try {
    // Convert to UTF-8 byte array
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const keyBytes = encoder.encode(key);
    
    // Perform XOR operation
    const encryptedBytes = new Uint8Array(messageBytes.length);
    for (let i = 0; i < messageBytes.length; i++) {
      encryptedBytes[i] = messageBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to Base64
    let binaryString = '';
    encryptedBytes.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    return btoa(binaryString);
  } catch (err) {
    console.error("❌ Encryption failed:", err);
    return null;
  }
}

// Improved XOR-based decryption
function decrypt(encrypted, key) {
  if (!encrypted || !key) return null;
  
  try {
    // Convert from Base64
    const binaryString = atob(encrypted);
    const encryptedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      encryptedBytes[i] = binaryString.charCodeAt(i);
    }
    
    const keyBytes = new TextEncoder().encode(key);
    
    // Perform XOR operation
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert back to string
    return new TextDecoder().decode(decryptedBytes);
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    return null;
  }
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
    
    if (encrypted === null) {
      appendMessage("⚠️ Failed to encrypt message");
      return;
    }

    socket.emit("send_message", {
      room,
      encryptedMessage: encrypted,
      sender: username,
    });

    // Display the original message in the sender's chat
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

// Improved message reception handler
socket.on("receive_message", (payload) => {
  if (!payload || typeof payload !== 'object' || !payload.encryptedMessage || !payload.sender) {
    console.error("Malformed payload:", payload);
    appendMessage("⚠️ Received a malformed message.");
    return;
  }

  const decrypted = decrypt(payload.encryptedMessage, SECRET_KEY);

  if (decrypted === null) {
    console.error("Decryption failed for message from:", payload.sender);
    appendMessage(`⚠️ Could not decrypt message from ${payload.sender}`);
  } else if (payload.sender !== username) { // Don't show duplicate messages
    appendMessage(`🧑 ${payload.sender}: ${decrypted}`);
  }
});

function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Connection error handling
socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
  appendMessage("⚠️ Connection error. Trying to reconnect...");
});

socket.on("reconnect", () => {
  appendMessage("✅ Reconnected to server");
  if (room) {
    socket.emit("join_room", room);
  }
});