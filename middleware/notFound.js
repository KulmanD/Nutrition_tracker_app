const { errorResponse } = require("../utils/responseHelper"); //grab our error helper

function notFound(req, res) { //catch missing pages
  return errorResponse( //send back an error
    res,
    404,
    "ROUTE_NOT_FOUND", //tell them it's not found
    "The requested route does not exist.",
    {
      method: req.method, //what they tried to do
      path: req.originalUrl //where they tried to go
    }
  );
}

module.exports = notFound; //share our not found handler