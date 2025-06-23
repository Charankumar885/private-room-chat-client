const socket = io("http://localhost:3000");
let room = "";
const SECRET_KEY = "mySuperSecretKey123"; // Keep this consistent between sender & receiver

// Simple encryption using btoa + XOR with key
function encrypt(message, key) {
  return btoa(message.split('').map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join(''));
}

// Decrypt with atob + XOR with key
function decrypt(encrypted, key) {
  return atob(encrypted).split('').map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  if (room !== "") {
    socket.emit("join_room", room);
    document.getElementById("chatArea").style.display = "block";
  }
}

function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg !== "") {
    const encrypted = encrypt(msg, SECRET_KEY);
    socket.emit("send_message", { room, encryptedMessage: encrypted });

    appendMessage("You: " + msg);
    document.getElementById("messageInput").value = "";
  }
}

socket.on("receive_message", (encryptedMessage) => {
  const decrypted = decrypt(encryptedMessage, SECRET_KEY);
  appendMessage("Stranger: " + decrypted);
});

function appendMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
