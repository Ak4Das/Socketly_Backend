const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      require: true,
    },
  },
  { timestamps: true },
)

UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password) // this.password is the hashed password stored in the database
}

const User = mongoose.model("User", UserSchema)

module.exports = User
