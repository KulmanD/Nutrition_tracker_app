const express = require("express");
const aiController = require("../controllers/aiController");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.post("/analyze-meal", authorize(["admin", "manager", "user"]), aiController.analyzeMealImage);

module.exports = router;