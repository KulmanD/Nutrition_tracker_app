const express = require("express"); //bring in express
const dashboardController = require("../controllers/dashboardController"); //grab dashboard functions

const router = express.Router(); //make a new router

router.get("/today", dashboardController.getTodayDashboard); //get today's stats

module.exports = router; //share our routes