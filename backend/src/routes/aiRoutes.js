const express = require("express"); //bring in express
const aiController = require("../controllers/aiController"); //grab ai functions
const { authorize } = require("../middleware/authorize"); //grab the auth check
const asyncHandler = require("../middleware/asyncHandler"); //grab error wrapper
const { uploadMealImage } = require("../middleware/uploadImage"); //handle meal image uploads

const router = express.Router(); //make a new router

router.post("/analyze-image", authorize(["admin", "manager", "user"]), uploadMealImage, asyncHandler(aiController.analyzeUploadedMealImage)); //analyze uploaded meal image
router.post("/analyze-meal", authorize(["admin", "manager", "user"]), asyncHandler(aiController.analyzeMealImage)); //keep legacy ai route

module.exports = router; //share our routes
