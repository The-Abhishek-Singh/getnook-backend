const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

connectDB();
require("./startup/workers");

const app = express();

app.use(cors({
  origin: [
    "https://www.getnook.me",
    "https://getnook.me",
    "http://localhost:3000"
  ],
  credentials: true,
}));


app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const blockRoutes = require('./routes/blockRoutes');
const seoRoutes = require('./routes/seoRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const linkRoutes = require("./routes/linkRoutes");
const testRoutes = require("./routes/testRoutes");
const socialRoutes = require('./routes/imageRoute')
const geoCodeRoutes = require("./routes/geoCodeRoutes")

app.use("/api/test", testRoutes);

app.use('/api/auth', authRoutes);// refresh token added , validation added
app.use('/api/blocks', blockRoutes);// validation added/checked , aspect ratio added
app.use('/api/seo', seoRoutes);
app.use('/api/upload', uploadRoutes);
app.use("/api/links", linkRoutes);
app.use('./api/analytics', analyticsRoutes);// updated analytics
app.use("/api/social", socialRoutes);
app.use('/api/geocode', geoCodeRoutes);


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
