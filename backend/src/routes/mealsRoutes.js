const express = require("express"); //bring in express
const mealsController = require("../controllers/mealsController"); //grab meal functions
const aiController = require("../controllers/aiController"); //grab ai functions
const { authorize } = require("../middleware/authorize"); //grab the auth check
const asyncHandler = require("../middleware/asyncHandler"); //grab error wrapper

const router = express.Router(); //make a new router

router.get("/", asyncHandler(mealsController.getAllMeals)); //get all meals
router.post("/analyze-image", authorize(["admin", "manager", "user"]), asyncHandler(aiController.analyzeMealImage)); //analyze a meal image
router.get("/:id", asyncHandler(mealsController.getMealById)); //get a specific meal
router.post("/", authorize(["admin", "manager", "user"]), asyncHandler(mealsController.createMeal)); //add a new meal
router.put("/:id", authorize(["admin", "manager", "user"]), asyncHandler(mealsController.updateMeal)); //update a meal
router.delete("/:id", authorize(["admin"]), asyncHandler(mealsController.deleteMeal)); //delete a meal (needs admin)

module.exports = router; //share our routes
