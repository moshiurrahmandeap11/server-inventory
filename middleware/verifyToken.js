import jwt from "jsonwebtoken";

// JWT middleware
const verifyToken = (req, res, next) => {

  const token = req.cookies.token;

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
