const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const authRoutes = require("./routes/auth.js")
const { Server } = require("socket.io")
const http = require("http")
const Messages = require("./models/Messages.js")
const User = require("./models/User.js")

dotenv.config()
const app = express()

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

app.use(cors())
app.use(express.json())

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongodb connected"))
  .catch((error) => console.error(error))

app.use("/auth", authRoutes)

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

app.get("/messages", async (req, res) => {
  const { sender, receiver } = req.query
  try {
    const messages = await Messages.find({
      $or: [
        {
          sender,
          receiver,
        },
        {
          sender: receiver,
          receiver: sender,
        },
      ],
    }).sort({ createdAt: 1 })
    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" })
  }
})

app.get("/users", async (req, res) => {
  const { currentUser } = req.query
  try {
    const users = await User.find({ username: { $ne: currentUser } })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" })
  }
})

const PORT = process.env.PORT || 5001

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
