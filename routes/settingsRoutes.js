const express = require("express");
const settingsController = require("../controllers/settingsController");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(settingsController.getUserSettings));
router.put("/", asyncHandler(settingsController.updateUserSettings));

module.exports = router;
