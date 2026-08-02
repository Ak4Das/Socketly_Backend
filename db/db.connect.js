const mongoose = require("mongoose")

const dotenv = require("dotenv")
dotenv.config();

const mongodbUri = process.env.MONGO_URI

const connectDB = async () => {
  try {
    await mongoose.connect(mongodbUri)
    console.log("Mongodb connected.")
  } catch (error) {
    console.error("Database connection failed:", error.message)
  }
}

module.exports = connectDB