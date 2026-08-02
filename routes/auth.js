const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/User.js")
const dotenv = require("dotenv")
const router = express.Router()
dotenv.config()
const auth = require("../middlewares/auth.js")

const JWT_SECRET = process.env.JWT_SECRET

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body
  try {
    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(400).json({ message: "User already exists." })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new User({ name, email, password: hashedPassword })
    await user.save()

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" })
    res.status(200).json({ message: "User registered successfully", token })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found." })
    }

    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid Password." })
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "24h",
    })

    res.status(200).json({ message: "Login Successful", token })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
