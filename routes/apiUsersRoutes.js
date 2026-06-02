const express = require("express");
const apiUsersController = require("../controllers/apiUsersController");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/me", asyncHandler(apiUsersController.getMe));

module.exports = router;
