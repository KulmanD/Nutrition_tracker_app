class AppError extends Error { //custom error for API responses
  constructor(statusCode, code, message, details) {
    super(message); //save the message on the Error object
    this.statusCode = statusCode; //http status to return
    this.code = code; //api error code
    this.details = details || {}; //extra helpful info
    this.isAppError = true; //mark it as our own error
  }
}

module.exports = AppError; //share the custom error
