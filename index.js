import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectDB } from "./db/db.js";
const PORT = process.env.PORT || 5000;

import basicSettings from "./routes/basicSettingsRoute/basic-settings.js";
import productCategories from "./routes/productsRoute/product-categories.js";
import totalProducts from "./routes/productsRoute/total-products.js";
import users from "./routes/usersRoute/users.js";

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration for Vercel
const allowedOrigins = [
  "http://localhost:3000",
  "https://super-inventory-khaki.vercel.app",
  "https://inventory.moshiurrahman.online",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));



app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

await connectDB();
 
// Routes
app.use("/api/users", users);
app.use("/api/basic-settings", basicSettings);
app.use("/api/products", totalProducts);
app.use("/api/product-categories", productCategories);

// Simple test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.get("/api/version", (req, res) => {
  res.json({
    success: true,
    version: "1.0.0",
    appName: "Super Inventory",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS Error: Origin not allowed"
    });
  }
  next(err);
});

// Add this route to check cookies
app.get("/api/test-cookie", (req, res) => {
  console.log("Cookies received:", req.cookies);
  console.log("Token cookie:", req.cookies?.token);
  
  res.json({
    success: true,
    message: "Cookie test endpoint",
    cookies: req.cookies,
    headers: req.headers
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});