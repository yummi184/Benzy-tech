// Global variables
let allTools = []
let currentCategory = "all"

// Load tools from API
async function loadTools() {
  try {
    const toolList = document.getElementById("tool-list")

    // Show loading spinner
    toolList.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `

    // Fetch tools data
    const response = await fetch("/api/tools")
    allTools = await response.json()

    // Assign unique IDs to each tool based on their index
    allTools.forEach((tool, index) => {
      tool.id = index + 1
    })

    // Display tools based on current category
    displayToolsByCategory(currentCategory)
  } catch (error) {
    console.error("Error fetching tools:", error)

    // Show error message
    const toolList = document.getElementById("tool-list")
    toolList.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <h3>Oops! Something went wrong</h3>
        <p>We couldn't load the tools. Please try again later.</p>
      </div>
    `
  }
}

// Display tools filtered by category
function displayToolsByCategory(category) {
  const toolList = document.getElementById("tool-list")

  // Clear current tools
  toolList.innerHTML = ""

  // Filter tools by category
  const filteredTools = category === "all" ? allTools : allTools.filter((tool) => tool.category === category)

  // Add tools with staggered animation
  if (filteredTools.length > 0) {
    filteredTools.forEach((tool, index) => {
      const toolCard = document.createElement("div")
      toolCard.classList.add("tool-card")
      toolCard.style.animationDelay = `${index * 0.1}s`

      // Get category badge class
      const categoryClass = tool.category ? `tool-category ${tool.category}` : ""
      const categoryText = tool.category ? tool.category.charAt(0).toUpperCase() + tool.category.slice(1) : ""

      // Create badge HTML if category exists
      const badgeHtml = tool.category ? `<div class="${categoryClass}">${categoryText}</div>` : ""

      // Create different button layouts based on category
      let commandBoxHtml = ""
      let actionsHtml = ""

      if (tool.category === "termux") {
        // Termux tools get command box, copy and inspect buttons
        commandBoxHtml = `
          <div class="command-box">
            <div class="command-text">${tool.command}</div>
          </div>
        `

        actionsHtml = `
          <div class="tool-actions">
            <button class="tool-btn btn-primary copy-cmd-btn" data-command="${tool.command}">
              <i class="fas fa-copy"></i> Copy CMD
            </button>
            <button class="tool-btn btn-secondary inspect-cmd-btn" data-command="${tool.command}" data-name="${tool.name}">
              <i class="fas fa-terminal"></i> Inspect
            </button>
            <button class="tool-btn btn-outline btn-copy-link" data-id="${tool.id || index + 1}">
              <i class="fas fa-link"></i> Copy Link
            </button>
          </div>
        `
      } else if (tool.category === "premium") {
        // Premium apps get download button
        actionsHtml = `
          <div class="tool-actions">
            <a href="${tool.link}" class="tool-btn btn-primary">
              <i class="fas fa-download"></i> Download
            </a>
            <button class="tool-btn btn-outline btn-copy-link" data-id="${tool.id || index + 1}">
              <i class="fas fa-link"></i> Copy Link
            </button>
          </div>
        `
      } else {
        // Random tools get try now button
        actionsHtml = `
          <div class="tool-actions">
            <a href="${tool.link}" class="tool-btn btn-primary">
              <i class="fas fa-external-link-alt"></i> Try Now
            </a>
            <button class="tool-btn btn-outline btn-copy-link" data-id="${tool.id || index + 1}">
              <i class="fas fa-link"></i> Copy Link
            </button>
          </div>
        `
      }

      toolCard.innerHTML = `
        <div class="tool-image">
          <img src="${tool.image}" alt="${tool.name}">
          ${badgeHtml}
        </div>
        <div class="tool-content">
          <h3 class="tool-title">${tool.name}</h3>
          <p class="tool-description">${tool.description}</p>
          ${commandBoxHtml}
          ${actionsHtml}
        </div>
      `

      toolList.appendChild(toolCard)
    })

    // Add event listeners for the new buttons
    setupButtonListeners()
  } else {
    // No tools in this category
    toolList.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <h3>No tools in this category</h3>
        <p>Please check another category or come back later</p>
      </div>
    `
  }
}

// Set up button event listeners
function setupButtonListeners() {
  // Copy command buttons
  document.querySelectorAll(".copy-cmd-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.getAttribute("data-command")
      copyToClipboard(command)
      showNotification("Command copied to clipboard!")
    })
  })

  // Inspect command buttons
  document.querySelectorAll(".inspect-cmd-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.getAttribute("data-command")
      const name = button.getAttribute("data-name")
      showCommandModal(command, name)
    })
  })

  // Modal close button
  document.querySelector(".modal-close").addEventListener("click", () => {
    document.getElementById("command-modal").classList.remove("active")
  })

  // Modal copy button
  document.getElementById("modal-copy-btn").addEventListener("click", () => {
    const command = document.getElementById("modal-command").textContent
    copyToClipboard(command)
    showNotification("Command copied to clipboard!")
  })

  // Close modal when clicking outside
  document.getElementById("command-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("command-modal")) {
      document.getElementById("command-modal").classList.remove("active")
    }
  })

  // Copy link buttons
  document.querySelectorAll(".btn-copy-link").forEach((button) => {
    button.addEventListener("click", () => {
      const toolId = button.getAttribute("data-id")
      const toolURL = `${window.location.origin}/#${toolId}`
      copyToClipboard(toolURL)
      showNotification("Link copied to clipboard!")
    })
  })
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error("Could not copy text: ", err)
  })
}

// Show notification
function showNotification(message) {
  const notification = document.getElementById("notification")
  notification.textContent = message
  notification.classList.add("show")

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

// Show command modal
function showCommandModal(command, toolName) {
  const modal = document.getElementById("command-modal")
  const modalCommand = document.getElementById("modal-command")
  const modalTitle = document.querySelector(".modal-title")

  modalTitle.textContent = `${toolName} - Command Details`
  modalCommand.textContent = command
  modal.classList.add("active")
}

// Initialize the app
document.addEventListener("DOMContentLoaded", async () => {
  // Set up category buttons
  const categoryButtons = document.querySelectorAll(".category-btn")
  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active button
      categoryButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Update current category and display tools
      currentCategory = button.getAttribute("data-category")
      displayToolsByCategory(currentCategory)
    })
  })

  await loadTools()

  // Check if there's an ID in the URL and display that tool only
  const toolId = window.location.hash.replace("#", "") // Extract ID from URL
  if (toolId) {
    displaySingleTool(toolId)
  } else {
    displayToolsByCategory(currentCategory) // Show all tools normally
  }
})

function displaySingleTool(toolId) {
  const toolList = document.getElementById("tool-list")
  toolList.innerHTML = "" // Clear previous content

  // Find the tool by ID
  const tool = allTools.find((t) => t.id == toolId)
  if (tool) {
    const toolCard = document.createElement("div")
    toolCard.classList.add("tool-card")
    toolCard.style.gridColumn = "1 / -1"
    toolCard.style.maxWidth = "600px"
    toolCard.style.margin = "0 auto"

    // Get category badge class
    const categoryClass = tool.category ? `tool-category ${tool.category}` : ""
    const categoryText = tool.category ? tool.category.charAt(0).toUpperCase() + tool.category.slice(1) : ""

    // Create badge HTML if category exists
    const badgeHtml = tool.category ? `<div class="${categoryClass}">${categoryText}</div>` : ""

    // Create different button layouts based on category
    let commandBoxHtml = ""
    let actionsHtml = ""

    if (tool.category === "termux") {
      // Termux tools get command box, copy and inspect buttons
      commandBoxHtml = `
        <div class="command-box">
          <div class="command-text">${tool.command}</div>
        </div>
      `

      actionsHtml = `
        <div class="tool-actions">
          <button class="tool-btn btn-primary copy-cmd-btn" data-command="${tool.command}">
            <i class="fas fa-copy"></i> Copy CMD
          </button>
          <button class="tool-btn btn-secondary inspect-cmd-btn" data-command="${tool.command}" data-name="${tool.name}">
            <i class="fas fa-terminal"></i> Inspect
          </button>
        </div>
      `
    } else if (tool.category === "premium") {
      // Premium apps get download button
      actionsHtml = `
        <div class="tool-actions">
          <a href="${tool.link}" class="tool-btn btn-primary">
            <i class="fas fa-download"></i> Download
          </a>
        </div>
      `
    } else {
      // Random tools get try now button
      actionsHtml = `
        <div class="tool-actions">
          <a href="${tool.link}" class="tool-btn btn-primary">
            <i class="fas fa-external-link-alt"></i> Try Now
          </a>
        </div>
      `
    }

    toolCard.innerHTML = `
      <div class="tool-image">
        <img src="${tool.image}" alt="${tool.name}">
        ${badgeHtml}
      </div>
      <div class="tool-content">
        <h3 class="tool-title">${tool.name}</h3>
        <p class="tool-description">${tool.description}</p>
        ${commandBoxHtml}
        ${actionsHtml}
      </div>
    `

    toolList.appendChild(toolCard)

    // Add event listeners for the new buttons
    setupButtonListeners()
  } else {
    toolList.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <h3>Tool Not Found</h3>
        <p>The tool you are looking for does not exist or has been removed.</p>
      </div>
    `
  }
}

