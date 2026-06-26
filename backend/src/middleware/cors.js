const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173"];

function getAllowedOrigins() {
  const configuredOrigins = String(process.env.ALLOWED_ORIGINS || "").trim();

  if (!configuredOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const allowedOrigins = configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;
}

function isAllowedOrigin(origin) {
  return getAllowedOrigins().includes(origin);
}

function cors(req, res, next) { //allow frontend requests
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.header("Access-Control-Allow-Origin", origin); //allow the configured React app
    res.header("Vary", "Origin"); //keep cached CORS responses origin-specific
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); //allowed methods
  res.header("Access-Control-Allow-Headers", "Content-Type, x-user-id, x-user-role"); //allowed headers

  if (req.method === "OPTIONS") { //browser preflight request
    return res.sendStatus(204); //send back no content
  }

  next(); //move to next middleware
}

module.exports = cors; //share cors middleware
module.exports.getAllowedOrigins = getAllowedOrigins;
