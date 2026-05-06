function successResponse(res, statusCode, data) {
  return res.status(statusCode).json({
    success: true,
    data: data,
    error: null
  });
}

function errorResponse(res, statusCode, code, message, details) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: code,
      message: message,
      details: details || {}
    }
  });
}

module.exports = {
  successResponse,
  errorResponse
};