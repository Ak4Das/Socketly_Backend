const multer = require("multer")
const cloudinary = require("cloudinary").v2
require("dotenv").config()
const fs = require("fs") // Needed to clean up temp files

// cloudinary.config tells the Cloudinary SDK which Cloudinary account it should use.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Upload function
const uploadFileToCloudinary = (file) => {
  /* resource_type is more important for videos/non-image files than for ordinary images, 
  cloudinary's upload API supports different resource types such as image, video etc.*/
  const options = {
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
  }

  return new Promise((resolve, reject) => {
    // Select the Cloudinary upload method
    const uploader = file.mimetype.startsWith("video")
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload

    // Cloudinary reads that file and uploads it to your Cloudinary account.
    uploader(file.path, options, (error, result) => {
      fs.unlink(file.path, () => {})
      if (error) {
        return reject(error)
      }
      resolve(result)
    })
  })
}

module.exports = {
  uploadFileToCloudinary,
}
