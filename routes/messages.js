const express = require("express")
const User = require("../models/User.js")
const Message = require("../models/Messages.js")

const router = express.Router()

router.post("/create", async (req, res) => {
  const { message, sender, receiver } = req.body
  try {
    const SENDER = await User.findById(sender)
    if (!SENDER) {
      res.status(400).json({ message: "Sender not found." })
    }
    const RECEIVER = await User.findById(receiver)
    if (!RECEIVER) {
      res.status(400).json({ message: "Receiver not found." })
    }

    const newMessage = new Message({ message, sender, receiver })
    await newMessage.save()
    res.status(200).json({
      success: true,
      message: "Message Sent",
      respondedData: newMessage,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/getAll", async (req, res) => {
  const { sender, receiver } = req.query
  try {
    const messages = await Message.find({
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
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email")
      .populate("receiver", "name email")
    res
      .status(200)
      .json({
        success: true,
        message: "Messages fetched successfully.",
        respondedData: messages,
      })
  } catch (error) {
    console.dir(error)
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
