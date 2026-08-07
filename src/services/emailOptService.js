const nodemailer = require("nodemailer") // nodemailer is a Node.js library used to send emails from your server.
const dotenv = require("dotenv")

dotenv.config()

// Transporter is basically Nodemailer's object responsible for communicating with the email server its basically connects your application to Gmail.
const transporter = nodemailer.createTransport({
  service: "gmail", // Here i use Gmail as my email service (Nodemailer can work with many email services).
  auth: {
    user: process.env.EMAIL_USER, // The Gmail account that will send the email.
    pass: process.env.EMAIL_PASS, // This is the credential Nodemailer uses to authenticate with Gmail SMTP server.
  },
})

// verify() checks whether the transporter can successfully connect/authenticate with the configured mail server.
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Configuration Error:", error)
  } else {
    console.log("SMTP is configured properly and ready to send emails.")
  }
})

const sendOtpToEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 WhatsApp Web Verification</h2>
      
      <p>Hi there,</p>
      
      <p>Your one-time password (OTP) to verify your WhatsApp Web account is:</p>
      
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>

      <p>If you didn't request this OTP, please ignore this email.</p>

      <p style="margin-top: 20px;">Thanks & Regards,<br/>WhatsApp Web Security Team</p>

      <hr style="margin: 30px 0;" />

      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `

  await transporter.sendMail({
    from: `"Socketly Web" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Socketly Verification Code",
    html,
  })
}

module.exports = sendOtpToEmail
