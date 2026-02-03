import cors from "cors";
import express from "express";
import { connectDB } from "./db/db.js";
const PORT = process.env.PORT || 5000;

import users from "./routes/usersRoute/users.js";
const app = express();

// middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    credentials: false
}));

await connectDB();

// routes
app.use("/api/users", users);


// Simple test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});