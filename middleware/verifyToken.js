import jwt from "jsonwebtoken";

// JWT middleware
const verifyToken = (req, res, next) => {
  // Token from headers
  const authHeader = req.headers["authorization"]; // frontend e usually: "Bearer TOKEN"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access Denied / No Token Provided" });
  }

  try {
    // Verify token
    const secret = process.env.JWT_SECRET; 
    const decoded = jwt.verify(token, secret);

    // Attach user info to req
    req.user = decoded;

    // Go to next middleware / route
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(403).json({ success: false, message: "Invalid Token" });
  }
};

export default verifyToken;
