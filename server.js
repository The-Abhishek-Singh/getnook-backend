const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const blockRoutes = require('./routes/blockRoutes');
const seoRoutes = require('./routes/seoRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const linkRoutes = require("./routes/linkRoutes");

app.use('/api/auth', authRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/upload', uploadRoutes);
app.use("/api/links", linkRoutes);
app.use('./api/analytics', analyticsRoutes);

app.get("/", (req, res) => {
  res.send("Bento Clone Backend is Running! 🚀");
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});