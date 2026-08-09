const response = (res, stateCode, message, data = null) => {
  if (
    !res ||
    typeof res.status !== "function" ||
    typeof res.json !== "function"
  ) {
    console.error("Invalid Express response object")
    return
  }
  const responseObject = {
    status: stateCode < 400 ? "success" : "error",
    message,
    data,
  }
  return res.status(stateCode).json(responseObject)
}

module.exports = response
