const socket = io("https://private-room-chat-server.onrender.com", {
  forceNew: true,
  reconnectionAttempts: 5
});

let room = "";
let username = "";
let SECRET_KEY = "";

// Robust encryption with error handling
function encrypt(message, key) {
  try {
    // Convert to UTF-8 bytes
    const msgBytes = new TextEncoder().encode(message);
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(msgBytes.length);
    
    // XOR encryption
    for (let i = 0; i < msgBytes.length; i++) {
      result[i] = msgBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to Base64 URL-safe format
    return btoa(String.fromCharCode(...result))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (err) {
    console.error("Encryption error:", err);
    return null;
  }
}

// Robust decryption with error handling
function decrypt(encrypted, key) {
  try {
    // Convert from URL-safe Base64
    let base64 = encrypted
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Pad with '=' to make valid Base64
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Convert from Base64
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(bytes.length);
    
    // XOR decryption
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(result);
  } catch (err) {
    console.error("Decryption error:", err);
    return null;
  }
}

// Improved message handler
socket.on("receive_message", (data) => {
  console.log("Raw received data:", data);
  
  if (!data || typeof data !== 'object') {
    console.error("Invalid message format");
    return;
  }

  // Handle string payload (legacy format)
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse string payload:", data);
      return;
    }
  }

  if (!data.encryptedMessage || !data.sender) {
    console.error("Malformed payload structure:", data);
    return;
  }

  // Skip our own messages
  if (data.sender === username) return;

  const decrypted = decrypt(data.encryptedMessage, SECRET_KEY);
  
  if (decrypted) {
    appendMessage(`🧑 ${data.sender}: ${decrypted}`);
  } else {
    console.error("Failed to decrypt message from:", data.sender);
    appendMessage(`⚠️ Could not decrypt message from ${data.sender}`);
  }
});

// Rest of your functions (joinRoom, sendMessage, etc.) remain the same
// but with added error handling as shown above