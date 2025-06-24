const socket = io("https://private-room-chat-server.onrender.com");

let room = "";
let username = "";
let SECRET_KEY = "";

// Simple XOR encryption that handles all characters
function encrypt(message, key) {
    let result = "";
    for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return btoa(unescape(encodeURIComponent(result)));
}

// Simple XOR decryption
function decrypt(encrypted, key) {
    try {
        const decoded = decodeURIComponent(escape(atob(encrypted)));
        let result = "";
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    } catch (e) {
        console.error("Decryption failed:", e);
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
        console.log("Encrypted message:", encrypted); // Debug log
        
        socket.emit("send_message", {
            room,
            encryptedMessage: encrypted,
            sender: username
        });

        // Display our own message immediately
        appendMessage(`🧑 ${username}: ${msg}`);
        document.getElementById("messageInput").value = "";
    }
}

socket.on("receive_message", (payload) => {
    console.log("Received payload:", payload); // Debug log
    
    if (!payload || !payload.encryptedMessage || !payload.sender) {
        console.error("Malformed payload:", payload);
        return;
    }

    // Don't process our own messages (already shown)
    if (payload.sender === username) return;

    const decrypted = decrypt(payload.encryptedMessage, SECRET_KEY);
    console.log("Decryption result:", decrypted); // Debug log
    
    if (decrypted) {
        appendMessage(`🧑 ${payload.sender}: ${decrypted}`);
    } else {
        appendMessage(`⚠️ Could not decrypt message from ${payload.sender}`);
    }
});

// Utility functions
function appendMessage(msg) {
    const messagesDiv = document.getElementById("messages");
    const p = document.createElement("p");
    p.innerText = msg;
    messagesDiv.appendChild(p);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function clearMessages() {
    document.getElementById("messages").innerHTML = "";
}

function leaveRoom() {
    socket.emit("leave_room", room);
    document.getElementById("chatArea").style.display = "none";
    appendMessage("🚪 You left the room.");
}

// Error handling
socket.on("connect_error", (err) => {
    console.error("Connection error:", err);
    appendMessage("⚠️ Connection error. Please refresh.");
});

socket.on("disconnect", () => {
    appendMessage("⚠️ Disconnected from server");
});