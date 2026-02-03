import express from "express";

const app = express();
const PORT = 5000;

// middleware
app.use(express.json());


// Simple test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});