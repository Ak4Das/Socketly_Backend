const express = require("express")
const router = express.Router()

const User = require("../models/User.js")
const auth = require("../middlewares/auth.js")

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(400).json({ message: "User profile not found." })
    }
    res.status(200)
    res.json({
      success: true,
      message: "user fetched successfully",
      respondedData: user,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/getAll", async (req, res) => {
  const { currentUser } = req.query
  try {
    const users = await User.find({ name: { $ne: currentUser } })
    res
      .status(200)
      .json({
        success: true,
        message: "Users fetched Successfully",
        respondedData: users,
      })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
