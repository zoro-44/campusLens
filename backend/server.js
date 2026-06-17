const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const statsRoutes = require("./routes/statsRoutes");
const exportRoutes = require("./routes/exportRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const sectionRoutes = require("./routes/sectionRoutes");

const authMiddleware = require("./middleware/authMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend running on localhost:5173 or deployed production URL
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
  origin: frontendUrl === "*" ? true : frontendUrl.split(","),
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically (essential for student photos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Register routes
app.use("/api/auth", authRoutes); // Public route for login

// Protected routes (require JWT token)
app.use("/api/students", authMiddleware, studentRoutes);
app.use("/api/stats", authMiddleware, authMiddleware.requireRole("admin"), statsRoutes);
app.use("/api/export", authMiddleware, authMiddleware.requireRole("admin"), exportRoutes);
app.use("/api/departments", authMiddleware, authMiddleware.requireRole("admin"), departmentRoutes);
app.use("/api/sections", authMiddleware, authMiddleware.requireRole("admin"), sectionRoutes);

// Centralized error handling middleware
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CampusLens Server running on port ${PORT}`);
  console.log(`🌐 Static assets served from ${path.join(__dirname, "uploads")}`);
});
