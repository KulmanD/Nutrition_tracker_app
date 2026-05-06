const express = require("express");
const mealsController = require("../controllers/mealsController");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get("/", mealsController.getAllMeals);
router.get("/:id", mealsController.getMealById);
router.post("/", authorize(["admin", "manager", "user"]), mealsController.createMeal);
router.put("/:id", authorize(["admin", "manager", "user"]), mealsController.updateMeal);
router.delete("/:id", authorize(["admin"]), mealsController.deleteMeal);

module.exports = router;