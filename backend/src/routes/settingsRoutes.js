const express = require("express"); //bring in express
const settingsController = require("../controllers/settingsController"); //grab settings functions
const asyncHandler = require("../middleware/asyncHandler"); //grab error wrapper

const router = express.Router(); //make a new router

router.get("/", asyncHandler(settingsController.getUserSettings)); //get user settings
router.put("/", asyncHandler(settingsController.updateUserSettings)); //update user settings

module.exports = router; //share our routes
