const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      unique: false,
      required: [true, "Phone number is required."],
    },
    phoneSuffix: {
      type: String,
      unique: false,
      required: [true, "Country code is required."],
    },
    username: { type: String, required: [true, "Username is required."] },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: [true, "This email is already exists."],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address.",
      ],
      required: [true, "Email is required."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    emailOtp: { type: Number },
    emailOtpExpiry: { type: Date },
    profilePicture: { type: String },
    about: { type: String },
    lastSeen: { type: Date },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    agreed: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const User = mongoose.model("User", userSchema)
module.exports = User
