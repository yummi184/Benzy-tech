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

// Words that users are not allowed to use as a name
const bannedUsernames = [
  "admin",
  "administrator",
  "moderator",
  "Admin",
  "owner",
  "emmy",
  "emmy henz tech",
  "blue demon",
  "Legacy",
  "official",
]

// Send message function
window.sendMessage = () => {
  const name = document.getElementById("username").value.trim()
  const text = document.getElementById("message").value.trim()
  if (!name || !text) return

  // Prevent users from using banned usernames
  if (bannedUsernames.some((banned) => name.toLowerCase().includes(banned))) {
    alert("Sorry, you cannot use this username. Please choose another one.")
    return
  }

  // Anti bug
  // Limit message length to 50 characters
  if (text.length > 50) {
    alert("Message too long! Maximum 80 characters allowed.")
    return
  }

  //Anti-link and phone number
  function containsBannedContent(text) {
    // Regular Expressions for detecting links, phone numbers, Gmail, and Telegram handles
    const linkRegex =
      /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-zA-Z0-9.-]+\.(com|net|org|io|xyz|gov|edu|info|biz|co|me|tv|uk|ng|za|ca|us|au|in)\b)/gi
    const phoneRegex = /\b\d{10,}\b/g // Detects numbers with at least 10 digits
    const gmailRegex = /\b[A-Za-z0-9._%+-]+@gmail\.com\b/gi // Blocks Gmail addresses
    const telegramRegex = /@\w{3,}/g // Blocks Telegram handles (e.g., @username)

    return linkRegex.test(text) || phoneRegex.test(text) || gmailRegex.test(text) || telegramRegex.test(text)
  }

  if (containsBannedContent(text)) {
    alert("Sending links, phone numbers, Gmail, or Telegram usernames is not allowed here.")
    return
  }

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

  // Check if it's the current user's message
  const isCurrentUser = senderId === userId
  if (isCurrentUser) {
    msgDiv.classList.add("user-message")
  }

  // Create message elements
  const profileImg = document.createElement("img")
  profileImg.src = profilePic
  profileImg.classList.add("profile-pic")

  const messageContent = document.createElement("div")
  messageContent.classList.add("message-content")

  const nameSpan = document.createElement("strong")
  nameSpan.innerHTML = name + (isAdmin ? verifiedTick : "") // Add verification tick for admins

  const messageText = document.createElement("p")
  messageText.innerHTML = text.replace(/\n/g, "<br>") // Converts new lines to <br>

  const timestampSpan = document.createElement("span")
  timestampSpan.classList.add("timestamp")
  timestampSpan.textContent = time

  // Append elements
  messageContent.appendChild(nameSpan)
  messageContent.appendChild(messageText)
  messageContent.appendChild(timestampSpan)

  msgDiv.appendChild(profileImg)
  msgDiv.appendChild(messageContent)

  // Show delete button only if it's the user's message
  if (senderId === userId) {
    const deleteBtn = document.createElement("button")
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'
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

// Function to fetch messages (dummy function, replace with actual implementation if needed)
function fetchMessages() {
  // In a real application, you would fetch messages from Firebase here
  // and update the chat-box accordingly.
  console.log("Fetching messages...")
}

// Refresh Every 3seconds
setInterval(fetchMessages, 3000)

// Next line
document.getElementById("message").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault() // Prevents new line
    window.sendMessage() // Send message when Enter is pressed
  }
})

// Add dark mode toggle functionality
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle")

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode")

      // Update icon
      const icon = themeToggle.querySelector("i")
      if (document.body.classList.contains("dark-mode")) {
        icon.classList.remove("fa-moon")
        icon.classList.add("fa-sun")
      } else {
        icon.classList.remove("fa-sun")
        icon.classList.add("fa-moon")
      }
    })
  }

  // Auto-resize textarea as user types
  const messageInput = document.getElementById("message")
  if (messageInput) {
    messageInput.addEventListener("input", function () {
      this.style.height = "auto"
      this.style.height = this.scrollHeight + "px"

      // Reset height if empty
      if (this.value === "") {
        this.style.height = "auto"
      }
    })
  }
})

