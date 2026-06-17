const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");

router.get("/", exportController.exportStudents);

module.exports = router;
