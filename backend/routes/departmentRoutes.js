const express = require("express");
const router = express.Router();
const Department = require("../models/departmentModel");

router.get("/", async (req, res, next) => {
  try {
    const departments = await Department.findAll();
    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
