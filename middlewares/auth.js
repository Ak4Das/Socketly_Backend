const jwt = require("jsonwebtoken")

function auth(req, res, next) {
  const authHeader = req.header("Authorization")
  if (!authHeader) {
    res
      .status(400)
      .json({ message: "Access Denied: Missing authentication JWT token." })
  }

  const token = authHeader.split(" ")[1]
  if (!token) {
    res
      .status(400)
      .json({ message: "Access Denied: Token not present in header." })
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    req.user = verified
    next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = auth
