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

// middleware
app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000",
  "https://super-inventory-khaki.vercel.app",
  "https://inventory.moshiurrahman.online",
];

app.use(cors({
  origin: function (origin, callback) {
    // allow REST tools / same-origin requests with no origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

await connectDB();

// routes
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


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});