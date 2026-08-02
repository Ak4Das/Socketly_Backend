const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
dotenv.config()

const authRoutes = require("./routes/auth.js")
const messagesRoutes = require("./routes/messages.js")
const userRoutes = require("./routes/user.js")

const { Server } = require("socket.io")
const http = require("http")

const Messages = require("./models/Messages.js")

const connectDatabase = require("./db/db.connect.js")

// Connect with DB
connectDatabase()

// Create Server
const app = express()
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200,
  }),
)
app.use(express.json())

// Socket.IO needs direct access to the HTTP server
// creates an HTTP server object
// Builds the server and configures it to use your Express app for handling HTTP requests.
const server = http.createServer(app) // Express routes and Socket.IO share the same server.

// Attaches Socket.IO to the HTTP server (app).
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // to establish a socket connection with frontend
  },
})

// Waiting for client connections Whenever a client connect the server fires connection event and creates a new socket object
io.on("connection", (socket) => {
  console.log("User Connected", socket.id)

  // Listening for messages
  socket.on("send_message", async (data) => {
    const { sender, receiver, message } = data
    const newMessage = new Messages({ sender, receiver, message })
    await newMessage.save()

    // Send the event to every connected client except the sender.
    socket.broadcast.emit("receive_message", data)
  })

  // Whenever a user closes the tab, loses internet, or disconnects, this event fires.
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id)
  })
})

// ROUTES
app.use("/auth", authRoutes)
app.use("/messages", messagesRoutes)
app.use("/user", userRoutes)

const PORT = process.env.PORT || 5001

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
