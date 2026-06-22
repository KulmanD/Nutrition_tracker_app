function successResponse(res, statusCode, data) { //send a happy response
  return res.status(statusCode).json({ //send json back with the status code
    success: true, //it worked
    data: data, //the stuff they wanted
    error: null //no errors here
  });
}

function errorResponse(res, statusCode, code, message, details) { //send a sad response
  return res.status(statusCode).json({ //send json back with the error code
    success: false, //it failed
    data: null, //no data for you
    error: { //error details
      code: code, //what went wrong
      message: message, //tell them why
      details: details || {} //extra info if we have it
    }
  });
}

module.exports = { //share our helpers
  successResponse,
  errorResponse
};