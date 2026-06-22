const express = require("express"); //bring in express
const authController = require("../controllers/authController"); //grab auth functions
const asyncHandler = require("../middleware/asyncHandler"); //grab error wrapper

const router = express.Router(); //make a new router

router.post("/login", asyncHandler(authController.login)); //login user
router.post("/logout", asyncHandler(authController.logout)); //logout user

module.exports = router; //share our routes
