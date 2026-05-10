const { errorResponse } = require("../utils/responseHelper"); //grab our error helper

function errorHandler(err, req, res, next) { //our main error catcher
  if (err && err.type === "entity.parse.failed") { //if it's bad json
    return errorResponse( //send back an error
      res,
      400,
      "INVALID_JSON", //tell them it's bad json
      "Request body contains invalid JSON.",
      {}
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
