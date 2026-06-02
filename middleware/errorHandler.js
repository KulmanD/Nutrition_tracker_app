const { errorResponse } = require("../utils/responseHelper"); //grab our error helper
const AppError = require("../utils/AppError"); //grab custom error

function errorHandler(err, req, res, next) { //our main error catcher
  if (err && err.type === "entity.parse.failed") { //if it's bad json
    const parseError = new AppError( //turn parser error into our error shape
      400,
      "INVALID_JSON", //tell them it's bad json
      "Request body contains invalid JSON.",
      {}
    );

    return errorResponse( //send back an error
      res,
      parseError.statusCode,
      parseError.code,
      parseError.message,
      parseError.details
    );
  }

  if (err && err.isAppError) { //if this is one of our app errors
    return errorResponse(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.details
    );
  }

  console.error(err); //log the error so we can fix it

  return errorResponse( //send a generic error back
    res,
    500,
    "INTERNAL_SERVER_ERROR", //tell them it's a server issue
    "An unexpected server error occurred.",
    {}
  );
}

module.exports = errorHandler; //share our error handler
