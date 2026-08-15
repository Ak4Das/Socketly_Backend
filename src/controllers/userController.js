const User = require("../../models/User")
const generateOtp = require("../../utils/otpGenerator")
const generateToken = require("../../utils/generateToken")
const response = require("../../utils/responseHandler")
const twilioService = require("../services/twilioService")
const { uploadFileToCloudinary } = require("../../config/cloudinaryConfig")
const Conversation = require("../../models/Conversation")
const sendOtpToEmail = require("../services/emailOptService")
const bcrypt = require("bcryptjs/dist/bcrypt")

// register user
const register = async (req, res) => {
  const { phoneNumber, phoneSuffix, username, email, password } = req.body
  try {
    const userExists = await User.findOne({ email })

    if (userExists) {
      return response(res, 400, "User already exists.")
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new User({
      phoneNumber,
      phoneSuffix,
      username,
      email,
      password: hashedPassword,
    })
    await user.save()

    return response(res, 200, "User registered successfully", user)
  } catch (error) {
    return response(res, 500, error.message)
  }
}

// Step 1: Send OTP
const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, password } = req.body
  const otp = generateOtp()
  const expiry = new Date(Date.now() + 5 * 60 * 1000)
  let user
  try {
    if (email) {
      user = await User.findOne({ email })

      if (!user) {
        return response(res, 400, "User not found.")
      }

      if (!password) {
        return response(res, 400, "Password is required.")
      }

      const isVerified = await bcrypt.compare(password, user.password)

      if (!isVerified) {
        return response(res, 400, "Invalid password.")
      }

      user.emailOtp = otp
      user.emailOtpExpiry = expiry
      await user.save()
      await sendOtpToEmail(email, otp)

      return response(res, 200, "OTP sent to email", { email })
    }

    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and phone suffix are required")
    }
    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`
    await twilioService.sendOtp(fullPhoneNumber)

    return response(res, 200, "OTP send successfully", user)
  } catch (error) {
    console.error(error)
    return response(res, 500, "Server Error")
  }
}

// Step 2: Verify OTP
const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body
  try {
    let user = await User.findOne({ email })
    if (!user) {
      return response(res, 400, "User not found")
    }

    // Email verification logic
    if (email) {
      const now = new Date()
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        !user.emailOtpExpiry ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "Invalid or expired OTP")
      }

      user.isVerified = true
      user.emailOtp = null
      user.emailOtpExpiry = null
      await user.save()
    }

    // Phone verification logic
    else {
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, "Phone number and suffix are required")
      }

      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`
      const result = await twilioService.verifyOtp(fullPhoneNumber, otp)
      if (result.status !== "approved") {
        return response(res, 400, "Invalid OTP")
      }

      user.isVerified = true
      await user.save()
    }

    // Token and cookie logic (common)
    const token = generateToken(user._id)

    return response(res, 200, "OTP verified successfully", { token, user })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return response(res, 500, "Server Error")
  }
}

// Step 3: Update Username and Profile Picture
const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body
  const userId = req.user.id

  try {
    const user = await User.findById(userId)
    const file = req.file

    if (file) {
      const uploadResult = await uploadFileToCloudinary(file)
      user.profilePicture = uploadResult?.secure_url
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture
    }
    if (username) user.username = username
    if (agreed) user.agreed = agreed
    if (about) user.about = about
    await user.save()

    return response(res, 200, "Profile updated", user)
  } catch (error) {
    return response(res, 500, "Server Error")
  }
}

const checkAuthenticated = async (req, res) => {
  try {
    const userId = req.user.id
    if (!userId)
      return response(
        res,
        404,
        "unauthenticated ! please login before access the data",
      )
    const user = await User.findById(userId)

    if (!user) return response(res, 403, "User not found")

    return response(res, 201, "user retrived and allow to use facebook", user)
  } catch (error) {
    return response(res, 500, "Internal server error", error.message)
  }
}

const getAllUsers = async (req, res) => {
  const loggedInUserId = req.user.id
  try {
    // Fetch all users excluding the logged-in user
    const users = await User.find({ _id: { $ne: loggedInUserId } })
      .select(
        "username profilePicture lastSeen isOnline phoneSuffix phoneNumber about",
      )
      .lean()

    // Retrieve conversations involving both the logged-in user and each other user
    const usersWithConversations = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUserId, user._id] },
        })
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean()

        return {
          ...user,
          conversation: conversation || null,
        }
      }),
    )

    response(res, 200, "Users retrieved successfully", usersWithConversations)
  } catch (error) {
    response(res, 500, error.message)
  }
}

const deleteUserById = async (req, res) => {
  const { id, password } = req.query
  try {
    const user = await User.findById(id)
    if (user) {
      if (user.password === password) {
        await User.findByIdAndDelete(id)
        response(res, 200, "User deleted successfully", user)
      } else {
        response(res, 400, "Operation unsuccessful")
      }
    } else {
      response(res, 400, "User not found")
    }
  } catch (error) {
    response(res, 500, error.message)
  }
}

module.exports = {
  register,
  sendOtp,
  verifyOtp,
  updateProfile,
  checkAuthenticated,
  getAllUsers,
  deleteUserById,
}
