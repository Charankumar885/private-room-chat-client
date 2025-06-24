const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
let SECRET_KEY = "";

// More reliable encryption function
function encrypt(message, key) {
  if (!message || !key) return null;
  
  try {
    // Convert message and key to buffers
    const msgBuffer = new TextEncoder().encode(message);
    const keyBuffer = new TextEncoder().encode(key);
    const result = new Uint8Array(msgBuffer.length);
    
    // XOR encryption
    for (let i = 0; i < msgBuffer.length; i++) {
      result[i] = msgBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    // Convert to Base64
    return btoa(String.fromCharCode(...result));
  } catch (err) {
    console.error("Encryption error:", err);
    return null;
  }
}

// More reliable decryption function
function decrypt(encrypted, key) {
  if (!encrypted || !key) return null;
  
  try {
    // Convert from Base64
    const binaryStr = atob(encrypted);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    const keyBuffer = new TextEncoder().encode(key);
    const result = new Uint8Array(bytes.length);
    
    // XOR decryption
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return new TextDecoder().decode(result);
  } catch (err) {
    console.error("Decryption error:", err);
    return null;
  }
}

// Modified message handler to prevent self-message decryption
socket.on("receive_message", (payload) => {
  if (!payload || !payload.encryptedMessage || !payload.sender) {
    console.error("Malformed payload:", payload);
    return;
  }

  // Don't try to decrypt our own messages (we already show them)
  if (payload.sender === username) return;

  const decrypted = decrypt(payload.encryptedMessage, SECRET_KEY);
  
  if (decrypted) {
    appendMessage(`🧑 ${payload.sender}: ${decrypted}`);
  } else {
    appendMessage(`⚠️ Could not decrypt message from ${payload.sender}`);
  }
});

// Rest of your existing functions remain the same
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

    // Display our own message immediately
    appendMessage(`🧑 ${username}: ${msg}`);
    document.getElementById("messageInput").value = "";
  }
}

function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Existing clearMessages and leaveRoom functions remain unchanged