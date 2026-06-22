const express = require("express");
const mealsController = require("../controllers/mealsController");
const { authorize } = require("../middleware/authorize");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post("/from-ai", authorize(["admin", "manager", "user"]), asyncHandler(mealsController.createMealFromAi));

module.exports = router;
