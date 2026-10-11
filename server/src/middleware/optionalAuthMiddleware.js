
const jwt = require("jsonwebtoken");

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // No token: allow public access
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(
      parts[1],
      process.env.JWT_SECRET
    );

    req.user = decoded;
  } catch (error) {
    req.user = null;
  }

  return next();
};

module.exports = optionalAuthMiddleware;
