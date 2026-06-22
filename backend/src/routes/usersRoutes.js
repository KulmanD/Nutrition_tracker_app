const express = require("express"); //bring in express
const usersController = require("../controllers/usersController"); //grab user functions
const { authorize, authorizeSelfOrRoles } = require("../middleware/authorize"); //grab the auth checks
const asyncHandler = require("../middleware/asyncHandler"); //grab error wrapper

const router = express.Router(); //make a new router

router.get("/", authorize(["admin", "manager"]), asyncHandler(usersController.getAllUsers)); //get all users
router.get("/:id", authorizeSelfOrRoles(["admin", "manager"], (req) => req.params.id), asyncHandler(usersController.getUserById)); //get one user by id
router.post("/", authorize(["admin", "manager"]), asyncHandler(usersController.createUser)); //create a user (needs admin/manager)
router.put("/:id", authorizeSelfOrRoles(["admin", "manager"], (req) => req.params.id), asyncHandler(usersController.updateUser)); //update a user (needs admin/manager or self)
router.delete("/:id", authorize(["admin"]), asyncHandler(usersController.deleteUser)); //delete a user (needs admin)

module.exports = router; //share our routes
