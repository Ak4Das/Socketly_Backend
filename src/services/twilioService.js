const twilio = require("twilio")
require("dotenv").config()

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID // This identifies your Twilio account.
const authToken = process.env.TWILIO_AUTH_TOKEN // This is used to authenticate your application with Twilio.
const serviceSid = process.env.TWILIO_SERVICE_SID // This identifies the Twilio Verify Service that manages your OTP verification.

// Your authenticated connection to Twilio's API.
const client = twilio(accountSid, authToken)

// Send OTP to phone number
const sendOtp = async (phoneNumber) => {
  try {
    console.log("Sending OTP to:", phoneNumber)
    if (!phoneNumber) {
      throw new Error("Phone number is required")
    }

    // Create a verification and send an OTP.
    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: phoneNumber, // Full phone number including country code
        channel: "sms",
      })

    // When the OTP is successfully sent, response obj contains service_sid, account_sid, to, channel, status: "pending", date_created etc props
    return response
  } catch (error) {
    console.error("Error sending OTP:", error)
    throw new Error("Failed to send OTP")
  }
}

// checks whether the OTP entered by the user is correct.
const verifyOtp = async (fullPhoneNumber, otp) => {
  try {
    console.log(`Verifying OTP for: ${fullPhoneNumber}`)
    console.log("Service SID:", serviceSid)

    // Check whether the OTP entered by the user is correct.
    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: fullPhoneNumber,
        code: otp,
      })
    console.log("Verification response:", response)

    // If the user enters the correct OTP, response obj contains service_sid, account_sid, to, channel, status: "approved", date_created etc props
    return response
  } catch (error) {
    console.error("Error verifying OTP:", error)
    throw new Error("OTP verification failed")
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
}
