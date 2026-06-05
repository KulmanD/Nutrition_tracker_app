function cors(req, res, next) { //allow frontend requests
  res.header("Access-Control-Allow-Origin", "http://localhost:3001"); //allow react app
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); //allowed methods
  res.header("Access-Control-Allow-Headers", "Content-Type, x-user-id, x-user-role"); //allowed headers

  if (req.method === "OPTIONS") { //browser preflight request
    return res.sendStatus(204); //send back no content
  }

  next(); //move to next middleware
}

module.exports = cors; //share cors middleware
