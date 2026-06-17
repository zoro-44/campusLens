const express = require("express");
const router = express.Router();
const Section = require("../models/sectionModel");

router.get("/", async (req, res, next) => {
  try {
    const { department_code, branch, year } = req.query;
    const sections = await Section.findAll({ department_code, branch, year });
    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
