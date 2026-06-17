const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  let token = req.query.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication failed: No token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "campuslens_secret_token_123");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Authentication failed: Invalid or expired token"
    });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: "Access Denied: Insufficient permissions"
      });
    }
    next();
  };
};

module.exports = verifyToken;
module.exports.requireRole = requireRole;
