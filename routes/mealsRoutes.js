const express = require("express"); //bring in express
const mealsController = require("../controllers/mealsController"); //grab meal functions
const aiController = require("../controllers/aiController"); //grab ai functions
const authorize = require("../middleware/authorize"); //grab the auth check

const router = express.Router(); //make a new router

router.get("/", mealsController.getAllMeals); //get all meals
router.post("/analyze-image", authorize(["admin", "manager", "user"]), aiController.analyzeMealImage); //analyze a meal image
router.get("/:id", mealsController.getMealById); //get a specific meal
router.post("/", authorize(["admin", "manager", "user"]), mealsController.createMeal); //add a new meal
router.put("/:id", authorize(["admin", "manager", "user"]), mealsController.updateMeal); //update a meal
router.delete("/:id", authorize(["admin"]), mealsController.deleteMeal); //delete a meal (needs admin)

module.exports = router; //share our routes