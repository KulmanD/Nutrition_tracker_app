function logger(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${timeTaken}ms`
    );
  });

  next();
}

module.exports = logger;