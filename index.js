const express = require("express")
const connectDB = require("./config/dbConfig")
const cors = require("cors")
const http = require("http")
const initializeSocket = require("./src/services/socketIoService")
const multer = require("multer")
require("dotenv").config()
const userRoutes = require("./src/routes/userRoute")
const chatRoutes = require("./src/routes/chatRoutes")
const statusRoute = require("./src/routes/statusRoute")

//* Connect to Database
connectDB()

//* Create Express server
const app = express()

//* Middlewares
// used to parse form data sent from the client in JSON ("application/json") body format and make that data available in req.body
app.use(express.json())
// used to parse form data sent from the client in URL-encoded ("application/x-www-form-urlencoded") body format and make that data available in req.body
// extended controls how complex/nested URL-encoded data is parsed.
app.use(express.urlencoded({ extended: true }))
// used to parse form data sent from the client in form-data ("multipart/form-data") body format and make that data available in req.body
/* { dest: "/uploads" } => Browser sends request body to server throw network in bytes stream format (chunk by chunk) and server temporarily save uploaded files inside the "/uploads" directory 
if we use "multer({ dest: "/uploads" })" so cloudinary get local filesystem path where actual uploaded file is available benefits of this approach is file doesn't load entirely
in server's RAM instead it loads on server disk this is very useful for large files but if we use "multer({ storage: multer.memoryStorage()})" then entire file will load in RAM
of the server.*/
// .single("media") => Expect exactly one uploaded file, and its field name must be media.
// multer put text fields inside req.body and uploaded file inside req.file.
app.use(multer({ dest: "/uploads" }).single("media"))

//* Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
}
app.use(cors(corsOptions))

// Socket.IO needs direct access to the HTTP server
// creates an HTTP server object
// Builds the server and configures it to use your Express app for handling HTTP requests.
// Express routes and Socket.IO share the same server.
const server = http.createServer(app) 

const io = initializeSocket(server)

//* Apply socket middleware BEFORE routes to provide io and socketUserMap inside req object
app.use((req, res, next) => {
  req.io = io
  req.socketUserMap = io.socketUserMap
  next()
})

//* Routes
app.use("/api/users", userRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/status", statusRoute)

//* Start Server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
