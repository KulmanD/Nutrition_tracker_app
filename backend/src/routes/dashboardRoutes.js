const express = require("express"); //bring in express
const dashboardController = require("../controllers/dashboardController"); //grab dashboard functions
const asyncHandler = require("../middleware/asyncHandler"); //grab error wrapper

const router = express.Router(); //make a new router

router.get("/today", asyncHandler(dashboardController.getTodayDashboard)); //get today's stats

module.exports = router; //share our routes
