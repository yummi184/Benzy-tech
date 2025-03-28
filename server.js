const express = require("express")
const fs = require("fs")
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")

const app = express()
const PORT = process.env.PORT || 7860

// Middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(
  session({
    secret: "emmyhenz-tech-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  }),
)

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")))

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next()
  }
  return res.redirect("/admin/login")
}

// API route to fetch tools data
app.get("/api/tools", (req, res) => {
  fs.readFile(path.join(__dirname, "data", "tools.json"), "utf8", (err, data) => {
    if (err) {
      res.status(500).json({ error: "Error reading tools data" })
    } else {
      res.json(JSON.parse(data))
    }
  })
})

// Admin login route
app.get("/admin/login", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect("/admin")
  }
  res.sendFile(path.join(__dirname, "public", "admin-login.html"))
})

// Admin login POST
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body

  // Simple authentication - in production, use proper auth with hashed passwords
  if (
    (username === "Benzy$#" && password === "Benzy@") ||
    (username === "demon#x" && password === "Taloalob.1")
  ) {
    req.session.isAdmin = true
    return res.json({ success: true })
  }

  res.status(401).json({ success: false, message: "Invalid credentials" })
})

// Admin logout
app.get("/api/admin/logout", (req, res) => {
  req.session.destroy()
  res.json({ success: true })
})

// Admin dashboard route (protected)
app.get("/admin", authenticateAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"))
})

// API route to get all tools (admin)
app.get("/api/admin/tools", authenticateAdmin, (req, res) => {
  fs.readFile(path.join(__dirname, "data", "tools.json"), "utf8", (err, data) => {
    if (err) {
      res.status(500).json({ error: "Error reading tools data" })
    } else {
      res.json(JSON.parse(data))
    }
  })
})

// API route to add a new tool
app.post("/api/admin/tools", authenticateAdmin, (req, res) => {
  const newTool = req.body

  // Validate required fields
  if (!newTool.name || !newTool.description || !newTool.image || !newTool.category) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  fs.readFile(path.join(__dirname, "data", "tools.json"), "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading tools data" })
    }

    const tools = JSON.parse(data)
    tools.push(newTool)

    fs.writeFile(path.join(__dirname, "data", "tools.json"), JSON.stringify(tools, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: "Error saving tool" })
      }
      res.json({ success: true, tool: newTool })
    })
  })
})

// API route to update a tool
app.put("/api/admin/tools/:index", authenticateAdmin, (req, res) => {
  const toolIndex = Number.parseInt(req.params.index)
  const updatedTool = req.body

  fs.readFile(path.join(__dirname, "data", "tools.json"), "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading tools data" })
    }

    const tools = JSON.parse(data)

    if (toolIndex < 0 || toolIndex >= tools.length) {
      return res.status(404).json({ error: "Tool not found" })
    }

    tools[toolIndex] = updatedTool

    fs.writeFile(path.join(__dirname, "data", "tools.json"), JSON.stringify(tools, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: "Error updating tool" })
      }
      res.json({ success: true, tool: updatedTool })
    })
  })
})

// API route to delete a tool
app.delete("/api/admin/tools/:index", authenticateAdmin, (req, res) => {
  const toolIndex = Number.parseInt(req.params.index)

  fs.readFile(path.join(__dirname, "data", "tools.json"), "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading tools data" })
    }

    const tools = JSON.parse(data)

    if (toolIndex < 0 || toolIndex >= tools.length) {
      return res.status(404).json({ error: "Tool not found" })
    }

    const deletedTool = tools.splice(toolIndex, 1)[0]

    fs.writeFile(path.join(__dirname, "data", "tools.json"), JSON.stringify(tools, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: "Error deleting tool" })
      }
      res.json({ success: true, tool: deletedTool })
    })
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

