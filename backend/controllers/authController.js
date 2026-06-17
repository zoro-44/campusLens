const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Admin = require("../models/adminModel");
const Student = require("../models/studentModel");

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required"
      });
    }

    // Find admin by username
    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET || "campuslens_secret_token_123",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: 'admin'
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.studentLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    // Find student by email
    const student = await Student.findByEmail(email);
    if (!student) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Normalize incoming password: trim and uppercase
    const normalizedPassword = password.trim().toUpperCase();

    // Verify password
    const isMatch = await bcrypt.compare(normalizedPassword, student.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { htno: student.htno, email: student.email, role: 'student' },
      process.env.JWT_SECRET || "campuslens_secret_token_123",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      student: {
        htno: student.htno,
        email: student.email,
        role: 'student'
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Old password and new password are required"
      });
    }

    if (req.user.role === 'student') {
      // Find student by email
      const student = await Student.findByEmail(req.user.email);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found"
        });
      }

      // Compare old password
      const isMatch = await bcrypt.compare(oldPassword, student.password_hash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: "Invalid old password"
        });
      }

      // Hash new password
      const newHash = await bcrypt.hash(newPassword, 10);
      await Student.updatePassword(student.htno, newHash);

      return res.status(200).json({
        success: true,
        message: "Password changed successfully"
      });
    } else if (req.user.role === 'admin') {
      // Find admin by username
      const admin = await Admin.findByUsername(req.user.username);
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: "Admin not found"
        });
      }

      // Compare old password
      const isMatch = await bcrypt.compare(oldPassword, admin.password_hash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: "Invalid old password"
        });
      }

      // Hash new password
      const newHash = await bcrypt.hash(newPassword, 10);
      const db = require("../config/db");
      await db.query("UPDATE admins SET password_hash = ? WHERE id = ?", [newHash, admin.id]);

      return res.status(200).json({
        success: true,
        message: "Password changed successfully"
      });
    } else {
      return res.status(403).json({
        success: false,
        error: "Access Denied: Insufficient permissions"
      });
    }
  } catch (error) {
    next(error);
  }
};
