function logger(req, res, next) { //our logging function
  const startTime = Date.now(); //record when we started

  res.on("finish", () => { //when the response is done
    const endTime = Date.now(); //record when we finished
    const timeTaken = endTime - startTime; //calculate how long it took

    console.log( //print it out
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${timeTaken}ms`
    );
  });

  next(); //move on to the next thing
}

module.exports = logger; //share the logger