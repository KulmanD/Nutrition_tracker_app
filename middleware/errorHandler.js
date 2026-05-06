const { errorResponse } = require("../utils/responseHelper");

function errorHandler(err, req, res, next) {
  if (err && err.type === "entity.parse.failed") {
    return errorResponse(
      res,
      400,
      "INVALID_JSON",
      "Request body contains invalid JSON.",
      {}
    );
  }

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
