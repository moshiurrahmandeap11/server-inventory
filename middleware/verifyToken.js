import jwt from "jsonwebtoken";

// JWT middleware
const verifyToken = (req, res, next) => {
  let token = "";

  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    console.log("Token from Authorization header:", token ? "Found" : "Not found");
  }
  
  // If no token in header, check cookies
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
    console.log("Token from cookie:", token ? "Found" : "Not found");
  }

  if (!token) {
    console.log("No token found in headers or cookies");
    return res.status(401).json({ 
      success: false, 
      message: "Access Denied / No Token Provided" 
    });
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
    return res.status(403).json({ 
      success: false, 
      message: "Invalid Token" 
    });
  }
};

export default verifyToken;