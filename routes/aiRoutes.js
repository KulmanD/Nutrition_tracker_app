const express = require("express"); //bring in express
const aiController = require("../controllers/aiController"); //grab ai functions
const { authorize } = require("../middleware/authorize"); //grab the auth check
const asyncHandler = require("../middleware/asyncHandler"); //grab error wrapper

const router = express.Router(); //make a new router

router.post("/analyze-meal", authorize(["admin", "manager", "user"]), asyncHandler(aiController.analyzeMealImage)); //analyze a meal image

module.exports = router; //share our routes
