const express = require("express")
const multer = require("multer")
const upload = multer({ dest: "uploads/" })
const userController = require("../controllers/userController")
const authMiddleware = require("../middlewares/authMiddleware")

const router = express.Router()

router.post("/register", userController.register)
router.post("/send-otp", userController.sendOtp)
router.post("/verify-otp", userController.verifyOtp)

router.put("/update-profile", authMiddleware, userController.updateProfile)
router.get("/check-auth", authMiddleware, userController.checkAuthenticated)
router.get("/other-users-list", authMiddleware, userController.getAllUsers)

router.delete("/delete-user", userController.deleteUserById)

module.exports = router
