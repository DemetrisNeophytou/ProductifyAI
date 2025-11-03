import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("✅ ProductifyAI backend is running successfully!");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});
