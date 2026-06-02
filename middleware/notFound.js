const AppError = require("../utils/AppError"); //grab custom error

function notFound(req, res, next) { //catch missing pages
  next(new AppError( //send error to the global handler
    404,
    "ROUTE_NOT_FOUND", //tell them it's not found
    "The requested route does not exist.",
    {
      method: req.method, //what they tried to do
      path: req.originalUrl //where they tried to go
    }
  ));
}

module.exports = notFound; //share our not found handler
