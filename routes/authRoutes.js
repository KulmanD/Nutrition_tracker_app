const express = require("express");
const authController = require("../controllers/authController");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post("/login", asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));

module.exports = router;
