const express = require("express"); //bring in express
const apiUsersController = require("../controllers/apiUsersController"); //grab current user functions
const asyncHandler = require("../middleware/asyncHandler"); //grab error wrapper

const router = express.Router(); //make a new router

router.get("/me", asyncHandler(apiUsersController.getMe)); //get logged in user

module.exports = router; //share our routes
