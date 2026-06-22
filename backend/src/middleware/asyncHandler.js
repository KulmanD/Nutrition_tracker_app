function asyncHandler(fn) { //wrap controllers so errors go to errorHandler
  return function (req, res, next) {
    try {
      Promise.resolve(fn(req, res, next)).catch(next); //catch async errors
    } catch (err) {
      next(err); //catch normal thrown errors
    }
  };
}

module.exports = asyncHandler; //share the wrapper
