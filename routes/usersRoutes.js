const express = require("express");
const usersController = require("../controllers/usersController");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get("/", usersController.getAllUsers);
router.get("/:id", usersController.getUserById);
router.post("/", authorize(["admin", "manager"]), usersController.createUser);
router.put("/:id", authorize(["admin", "manager"]), usersController.updateUser);
router.delete("/:id", authorize(["admin"]), usersController.deleteUser);

module.exports = router;