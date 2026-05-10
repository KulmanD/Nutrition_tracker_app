const express = require("express"); //bring in express
const usersController = require("../controllers/usersController"); //grab user functions
const authorize = require("../middleware/authorize"); //grab the auth check

const router = express.Router(); //make a new router

router.get("/", usersController.getAllUsers); //get all users
router.get("/:id", usersController.getUserById); //get one user by id
router.post("/", authorize(["admin", "manager"]), usersController.createUser); //create a user (needs admin/manager)
router.put("/:id", authorize(["admin", "manager"]), usersController.updateUser); //update a user (needs admin/manager)
router.delete("/:id", authorize(["admin"]), usersController.deleteUser); //delete a user (needs admin)

module.exports = router; //share our routes