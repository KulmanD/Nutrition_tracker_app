const { errorResponse } = require("../utils/responseHelper");

function notFound(req, res) {
  return errorResponse(
    res,
    404,
    "ROUTE_NOT_FOUND",
    "The requested route does not exist.",
    {
      method: req.method,
      path: req.originalUrl
    }
  );
}

module.exports = notFound;