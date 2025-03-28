// Global variables
let allTools = []
let currentToolIndex = -1

// DOM Elements
const sidebarLinks = document.querySelectorAll(".sidebar-nav a[data-section]")
const contentSections = document.querySelectorAll(".content-section")
const mobileMenuToggle = document.getElementById("mobile-menu-toggle")
const sidebar = document.querySelector(".admin-sidebar")
const logoutBtn = document.getElementById("logout-btn")
const addToolForm = document.getElementById("add-tool-form")
const toolCategorySelect = document.getElementById("tool-category")
const commandGroup = document.getElementById("command-group")
const editToolForm = document.getElementById("edit-tool-form")
const editToolCategory = document.getElementById("edit-tool-category")
const editCommandGroup = document.getElementById("edit-command-group")
const editModal = document.getElementById("edit-modal")
const deleteModal = document.getElementById("delete-modal")
const modalCloseButtons = document.querySelectorAll(".modal-close")
const cancelEditBtn = document.getElementById("cancel-edit")
const cancelDeleteBtn = document.getElementById("cancel-delete")
const confirmDeleteBtn = document.getElementById("confirm-delete")
const categoryFilter = document.getElementById("category-filter")
const searchInput = document.getElementById("search-tools")

// Initialize the admin panel
document.addEventListener("DOMContentLoaded", async () => {
  // Load tools data
  await loadTools()

  // Update dashboard stats
  updateDashboardStats()

  // Load recent tools
  loadRecentTools()

  // Set up event listeners
  setupEventListeners()
})

// Load tools data from API
async function loadTools() {
  try {
    const response = await fetch("/api/admin/tools")

    if (!response.ok) {
      throw new Error("Failed to fetch tools")
    }

    allTools = await response.json()

    // Populate tools table
    populateToolsTable(allTools)

    // Hide loading spinner
    document.getElementById("tools-loading").style.display = "none"

    return allTools
  } catch (error) {
    console.error("Error loading tools:", error)
    showNotification("Error loading tools. Please try again.", "error")
    return []
  }
}

// Update dashboard statistics
function updateDashboardStats() {
  const totalTools = allTools.length
  const termuxTools = allTools.filter((tool) => tool.category === "termux").length
  const premiumTools = allTools.filter((tool) => tool.category === "premium").length
  const randomTools = allTools.filter((tool) => tool.category === "random").length

  document.getElementById("total-tools").textContent = totalTools
  document.getElementById("termux-tools").textContent = termuxTools
  document.getElementById("premium-tools").textContent = premiumTools
  document.getElementById("random-tools").textContent = randomTools
}

// Load recent tools for dashboard
function loadRecentTools() {
  const recentToolsList = document.getElementById("recent-tools-list")
  const recentTools = [...allTools].reverse().slice(0, 4)

  if (recentTools.length === 0) {
    recentToolsList.innerHTML = '<p class="text-center">No tools available</p>'
    return
  }

  recentToolsList.innerHTML = ""

  recentTools.forEach((tool) => {
    const toolCard = document.createElement("div")
    toolCard.className = "recent-tool-card"

    toolCard.innerHTML = `
            <div class="recent-tool-image">
                <img src="${tool.image}" alt="${tool.name}">
            </div>
            <div class="recent-tool-content">
                <h4>${tool.name}</h4>
                <p>${tool.description}</p>
                <span class="recent-tool-category ${tool.category}">${tool.category}</span>
            </div>
        `

    recentToolsList.appendChild(toolCard)
  })
}

// Populate tools table
function populateToolsTable(tools) {
  const tableBody = document.getElementById("tools-table-body")
  tableBody.innerHTML = ""

  if (tools.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No tools found</td>
            </tr>
        `
    return
  }

  tools.forEach((tool, index) => {
    const row = document.createElement("tr")

    row.innerHTML = `
            <td>${tool.name}</td>
            <td><span class="category-badge-small ${tool.category}">${tool.category}</span></td>
            <td>${tool.description.substring(0, 100)}${tool.description.length > 100 ? "..." : ""}</td>
            <td>
                <div class="table-actions">
                    <button class="edit-btn" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-index="${index}" data-name="${tool.name}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `

    tableBody.appendChild(row)
  })

  // Add event listeners to edit and delete buttons
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number.parseInt(button.getAttribute("data-index"))
      openEditModal(index)
    })
  })

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number.parseInt(button.getAttribute("data-index"))
      const name = button.getAttribute("data-name")
      openDeleteModal(index, name)
    })
  })
}

// Set up event listeners
function setupEventListeners() {
  // Sidebar navigation
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Remove active class from all links
      sidebarLinks.forEach((link) => link.parentElement.classList.remove("active"))

      // Add active class to clicked link
      link.parentElement.classList.add("active")

      // Show corresponding section
      const sectionId = link.getAttribute("data-section")
      contentSections.forEach((section) => {
        section.classList.remove("active")
      })
      document.getElementById(sectionId).classList.add("active")

      // Close mobile menu if open
      sidebar.classList.remove("active")
    })
  })

  // Mobile menu toggle
  mobileMenuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active")
  })

  // Logout button
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/admin/logout")
      const data = await response.json()

      if (data.success) {
        window.location.href = "/admin/login"
      }
    } catch (error) {
      console.error("Error logging out:", error)
      showNotification("Error logging out. Please try again.", "error")
    }
  })

  // Tool category change (show/hide command field)
  toolCategorySelect.addEventListener("change", () => {
    commandGroup.style.display = toolCategorySelect.value === "termux" ? "block" : "none"
  })

  // Edit tool category change
  editToolCategory.addEventListener("change", () => {
    editCommandGroup.style.display = editToolCategory.value === "termux" ? "block" : "none"
  })

  // Add tool form submission
  addToolForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(addToolForm)
    const newTool = {
      name: formData.get("name"),
      description: formData.get("description"),
      image: formData.get("image"),
      link: formData.get("link"),
      category: formData.get("category"),
    }

    // Add command if it's a termux tool
    if (newTool.category === "termux") {
      newTool.command = formData.get("command")
    }

    try {
      const response = await fetch("/api/admin/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTool),
      })

      const data = await response.json()

      if (data.success) {
        showNotification("Tool added successfully!", "success")
        addToolForm.reset()
        commandGroup.style.display = "none"

        // Reload tools
        await loadTools()
        updateDashboardStats()
        loadRecentTools()
      } else {
        showNotification(data.error || "Error adding tool", "error")
      }
    } catch (error) {
      console.error("Error adding tool:", error)
      showNotification("Error adding tool. Please try again.", "error")
    }
  })

  // Edit tool form submission
  editToolForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(editToolForm)
    const updatedTool = {
      name: formData.get("name"),
      description: formData.get("description"),
      image: formData.get("image"),
      link: formData.get("link"),
      category: formData.get("category"),
    }

    // Add command if it's a termux tool
    if (updatedTool.category === "termux") {
      updatedTool.command = formData.get("command")
    }

    try {
      const response = await fetch(`/api/admin/tools/${currentToolIndex}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTool),
      })

      const data = await response.json()

      if (data.success) {
        showNotification("Tool updated successfully!", "success")
        closeEditModal()

        // Reload tools
        await loadTools()
        updateDashboardStats()
        loadRecentTools()
      } else {
        showNotification(data.error || "Error updating tool", "error")
      }
    } catch (error) {
      console.error("Error updating tool:", error)
      showNotification("Error updating tool. Please try again.", "error")
    }
  })

  // Category filter change
  categoryFilter.addEventListener("change", () => {
    const category = categoryFilter.value
    const filteredTools = category === "all" ? allTools : allTools.filter((tool) => tool.category === category)
    populateToolsTable(filteredTools)
  })

  // Search tools
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase()

    if (searchTerm.trim() === "") {
      populateToolsTable(allTools)
      return
    }

    const filteredTools = allTools.filter(
      (tool) => tool.name.toLowerCase().includes(searchTerm) || tool.description.toLowerCase().includes(searchTerm),
    )

    populateToolsTable(filteredTools)
  })

  // Modal close buttons
  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeAllModals()
    })
  })

  // Cancel edit button
  cancelEditBtn.addEventListener("click", () => {
    closeEditModal()
  })

  // Cancel delete button
  cancelDeleteBtn.addEventListener("click", () => {
    closeDeleteModal()
  })

  // Confirm delete button
  confirmDeleteBtn.addEventListener("click", async () => {
    if (currentToolIndex === -1) return

    try {
      const response = await fetch(`/api/admin/tools/${currentToolIndex}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        showNotification("Tool deleted successfully!", "success")
        closeDeleteModal()

        // Reload tools
        await loadTools()
        updateDashboardStats()
        loadRecentTools()
      } else {
        showNotification(data.error || "Error deleting tool", "error")
      }
    } catch (error) {
      console.error("Error deleting tool:", error)
      showNotification("Error deleting tool. Please try again.", "error")
    }
  })
}

// Open edit modal
function openEditModal(index) {
  currentToolIndex = index
  const tool = allTools[index]

  // Fill form with tool data
  document.getElementById("edit-tool-index").value = index
  document.getElementById("edit-tool-name").value = tool.name
  document.getElementById("edit-tool-category").value = tool.category
  document.getElementById("edit-tool-description").value = tool.description
  document.getElementById("edit-tool-image").value = tool.image
  document.getElementById("edit-tool-link").value = tool.link

  // Show/hide command field based on category
  editCommandGroup.style.display = tool.category === "termux" ? "block" : "none"

  // Set command if it exists
  if (tool.category === "termux" && tool.command) {
    document.getElementById("edit-tool-command").value = tool.command
  } else {
    document.getElementById("edit-tool-command").value = ""
  }

  // Show modal
  editModal.classList.add("active")
}

// Close edit modal
function closeEditModal() {
  editModal.classList.remove("active")
  currentToolIndex = -1
}

// Open delete modal
function openDeleteModal(index, name) {
  currentToolIndex = index
  document.getElementById("delete-tool-name").textContent = name
  deleteModal.classList.add("active")
}

// Close delete modal
function closeDeleteModal() {
  deleteModal.classList.remove("active")
  currentToolIndex = -1
}

// Close all modals
function closeAllModals() {
  editModal.classList.remove("active")
  deleteModal.classList.remove("active")
  currentToolIndex = -1
}

// Show notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("admin-notification")
  notification.textContent = message
  notification.className = "admin-notification"
  notification.classList.add(type)
  notification.classList.add("show")

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

