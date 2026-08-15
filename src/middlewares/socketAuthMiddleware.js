const jwt = require("jsonwebtoken")

const socketAuthMiddleware = (socket, next) => {
  // here socket is socket obj of the user whose socket.io connection is underway
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error("Authentication token missing"))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.user = decoded
    next()
  } catch (error) {
    return next(new Error("Invalid or expired token"))
  }
}

module.exports = socketAuthMiddleware
