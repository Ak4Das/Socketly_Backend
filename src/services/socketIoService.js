const { Server } = require("socket.io")
const User = require("../../models/User")
const Message = require("../../models/Message")
const socketAuthMiddleware = require("../middlewares/socketAuthMiddleware")

// Map to store online users: userId -> socketId
const onlineUsers = new Map()

// Map to track typing status: userId -> { conversationId: boolean, conversationId_timeout: timeout }
const typingUsers = new Map()

const initializeSocket = (server) => {
  // Attaches Socket.IO to the HTTP server (app).
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      // cors allows credentials like cookies and token with request URL
      credentials: true,
      // cors allow requests from the frontend using these HTTP methods.
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Why OPTIONS? - Sometimes the browser doesn't immediately send the actual request. It first sends an OPTIONS request to ask the server: Am I allowed to make this request from this origin using this method?
    },
    pingTimeout: 60000, // Server sends ping then Client must respond with pong if No pong for 60 seconds then Socket.IO disconnects the socket
  })

  // Middleware to verify JWT token while user want to establish socket.io connection, if token valid then connection allowed otherwise not
  io.use(socketAuthMiddleware)

  // Waiting for client connections Whenever a client connect the server fires connection event and creates a new socket object
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`)
    let userId = null

    // Handle user connection and mark them online in DB
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId
        onlineUsers.set(userId, socket.id)
        socket.join(userId) // you can send an event directly to that user using their room.

        // Update user status in DB
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        })

        // Notify all users that this user is now online
        io.emit("user_status", { userId, isOnline: true })
      } catch (error) {
        console.error("Error handling user connection:", error)
      }
    })

    // Return online status of requested user
    socket.on("get_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId)
      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      })
    })

    // Forward message to receiver if online
    socket.on("send_message", async (message) => {
      try {
        const receiverSocketId = onlineUsers.get(message.receiver._id)
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message)
        }
      } catch (error) {
        console.error("Error sending message:", error)
        socket.emit("message_error", { error: "Failed to send message" })
      }
    })

    // Handle typing start event and auto-stop after 3s
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return

      if (!typingUsers.has(userId)) typingUsers.set(userId, {})
      const userTyping = typingUsers.get(userId)

      userTyping[conversationId] = true

      // Notify receiver
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      })

      // Clear any existing timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`])
      }

      // Auto-stop typing after 3 seconds
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        })
      }, 3000)
    })
    // Add or update reaction on a message
    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId: reactingUserId }) => {
        try {
          const message = await Message.findById(messageId)
          if (!message) return

          const existingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactingUserId,
          )

          if (existingIndex > -1) {
            const existing = message.reactions[existingIndex]
            if (existing.emoji === emoji) {
              // Remove same reaction
              message.reactions.splice(existingIndex, 1)
            } else {
              // Change emoji
              message.reactions[existingIndex].emoji = emoji
            }
          } else {
            // Add new reaction
            message.reactions.push({ user: reactingUserId, emoji })
          }

          await message.save()

          // Repopulate updated message
          const populatedMessage = await Message.findById(messageId)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .populate("reactions.user", "username")

          const reactionUpdate = {
            messageId,
            reactions: populatedMessage.reactions,
          }

          // Emit to both sender and receiver
          const senderSocket = onlineUsers.get(
            populatedMessage.sender._id.toString(),
          )
          const receiverSocket = onlineUsers.get(
            populatedMessage.receiver._id.toString(),
          )

          if (senderSocket)
            io.to(senderSocket).emit("reaction_update", reactionUpdate)
          if (receiverSocket)
            io.to(receiverSocket).emit("reaction_update", reactionUpdate)
        } catch (error) {
          console.error("Error handling reaction:", error)
        }
      },
    )

    // Disconnect and mark user offline
    socket.on("disconnect", async () => {
      if (!userId) return

      try {
        onlineUsers.delete(userId)

        // Clear all typing timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId)
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key])
          })
          typingUsers.delete(userId)
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        })

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        })

        socket.leave(userId)
        console.log(`User ${userId} disconnected`)
      } catch (error) {
        console.error("Error handling disconnection:", error)
      }
    })
  })

  // Attach the online user map to the socket server for external use
  io.socketUserMap = onlineUsers

  return io
}

module.exports = initializeSocket
