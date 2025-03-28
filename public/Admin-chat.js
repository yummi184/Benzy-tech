// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  remove,
  set,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"

// Firebase config (replace with your own values)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "https://emmyhenztech-chat-default-rtdb.firebaseio.com/",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const chatRef = ref(db, "globalChat")

// Generate a unique user ID if not already stored
if (!localStorage.getItem("userId")) {
  localStorage.setItem("userId", Math.random().toString(36).substr(2, 9))
}
const userId = localStorage.getItem("userId")

// Set admin details
const adminUsers = ["Admin"] // List of admin usernames
const adminProfilePic = "https://files.catbox.moe/0xciu6.jpg" // Admin profile picture
const verifiedTick =
  '<img src="https://files.catbox.moe/18su1u.jpg" class="verified" style="width:16px; height:16px; margin-left:4px;">'

// Send message function
window.sendMessage = () => {
  const name = document.getElementById("username").value.trim()
  const text = document.getElementById("message").value.trim()
  if (!name || !text) return

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  // Check if the user is an admin
  const isAdmin = adminUsers.includes(name)

  const profilePic = isAdmin ? adminProfilePic : "https://files.catbox.moe/q4ijwv.jpeg" // Default profile picture

  // Push message to Firebase
  const newMessageRef = push(chatRef)
  set(newMessageRef, { id: userId, name, text, time, profilePic, isAdmin })

  document.getElementById("message").value = "" // Clear input field
}

// Listen for new messages
onChildAdded(chatRef, (snapshot) => {
  const messageData = snapshot.val()
  const messageId = snapshot.key // Get message ID
  if (messageData) {
    addMessage(
      messageId,
      messageData.name,
      messageData.text,
      messageData.time,
      messageData.id,
      messageData.profilePic,
      messageData.isAdmin,
    )
  }
})

// Function to display messages
function addMessage(messageId, name, text, time, senderId, profilePic, isAdmin) {
  const chatBox = document.getElementById("chat-box")
  if (!chatBox) return

  const msgDiv = document.createElement("div")
  msgDiv.classList.add("message")

  // Create message elements
  const profileImg = document.createElement("img")
  profileImg.src = profilePic
  profileImg.classList.add("profile-pic")

  const messageContent = document.createElement("div")
  messageContent.classList.add("message-content")

  const nameSpan = document.createElement("strong")
  nameSpan.innerHTML = name + (isAdmin ? verifiedTick : "") // Add verification tick for admins

  const timestampSpan = document.createElement("span")
  timestampSpan.classList.add("timestamp")
  timestampSpan.textContent = time

  const messageText = document.createElement("p")
  messageText.innerHTML = text.replace(/\n/g, "<br>") // Converts new lines to <br>

  // Append elements
  messageContent.appendChild(nameSpan)
  messageContent.appendChild(timestampSpan)
  messageContent.appendChild(messageText)

  msgDiv.appendChild(profileImg)
  msgDiv.appendChild(messageContent)

  // Show delete button only if it's the user's message
  if (senderId === userId) {
    const deleteBtn = document.createElement("button")
    deleteBtn.textContent = "Delete"
    deleteBtn.classList.add("delete-btn")
    deleteBtn.onclick = () => {
      deleteMessage(messageId)
    }
    msgDiv.appendChild(deleteBtn)
  }

  chatBox.appendChild(msgDiv)
  chatBox.scrollTop = chatBox.scrollHeight // Auto-scroll to latest message
}

// Function to delete a message
function deleteMessage(messageId) {
  const messageRef = ref(db, `globalChat/${messageId}`)
  remove(messageRef)
    .then(() => {
      alert("Message deleted!")
    })
    .catch((error) => {
      alert("Error deleting message: " + error.message)
    })
}

const messageInput = document.getElementById("message")
const typingIndicator = document.querySelector(".typing-indicator")

messageInput.addEventListener("input", () => {
  typingIndicator.style.display = messageInput.value ? "block" : "none"
})

// Refresh Every 3seconds
setInterval(fetchMessages, 3000)

// Next line
document.getElementById("message").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault() // Prevents new line
    sendMessage() // Send message when Enter is pressed
  }
})

