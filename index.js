const express = require("express")
const bodyParser = require("body-parser")
const connectDB = require("./config/dbConfig")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const http = require("http")
const initializeSocket = require("./src/services/socketIoService")
require("dotenv").config()

// Connect to Database
connectDB()

// Create Express server
const app = express()

// Middlewares
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true })) // used to parse data sent from the client in URL-encoded format and make that data available in req.body

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
}
app.use(cors(corsOptions))

// Socket.IO needs direct access to the HTTP server
// creates an HTTP server object
// Builds the server and configures it to use your Express app for handling HTTP requests.
const server = http.createServer(app) // Express routes and Socket.IO share the same server.

const io = initializeSocket(server)

// Apply socket middleware BEFORE routes
app.use((req, res, next) => {
  req.io = io
  req.socketUserMap = io.socketUserMap // This is the key missing piece!
  next()
})

// Routes
const userRoutes = require("./src/routes/userRoute")
const chatRoutes = require("./src/routes/chatRoutes")
const statusRoute = require("./src/routes/statusRoute")

app.use("/api/users", userRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/status", statusRoute)

// Start Server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
