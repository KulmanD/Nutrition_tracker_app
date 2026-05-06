const { errorResponse } = require("../utils/responseHelper");

function errorHandler(err, req, res, next) {
  console.error(err);

  return errorResponse(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    "An unexpected server error occurred.",
    {}
  );
}

module.exports = errorHandler;