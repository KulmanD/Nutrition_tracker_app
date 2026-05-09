const { getMeals } = require("../models/mealsData");
const { successResponse, errorResponse } = require("../utils/responseHelper");
const { getUsers } = require("../models/usersData");


function isValidNumericId(id) {
  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0;
}

function getTodayDashboard(req, res) {
  const userId = req.query.userId;
  const date = req.query.date || "2026-05-06";

  if (!userId) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required query parameter: userId", {
      field: "userId"
    });
  }

  if (!isValidNumericId(userId)) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid userId query parameter.", {
      field: "userId",
      value: userId
    });
  }

  const numericUserId = Number(userId);

  const dailyGoals = {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 70
  };

  const allUsers = getUsers();
  const userExists = allUsers.some(u => u.userId === numericUserId);

  if (!userExists) {
    return errorResponse(res, 404, "USER_NOT_FOUND", "Cannot generate dashboard for a non-existent user.", { userId: numericUserId });
  }


  const allMeals = getMeals();
  const meals = [];

  for (let i = 0; i < allMeals.length; i++) {
    const currentMeal = allMeals[i];

    if (currentMeal.userId === numericUserId && currentMeal.mealDate === date) {
      meals.push(currentMeal);
    }
  }

  let consumedCalories = 0;
  let consumedProtein = 0;
  let consumedCarbs = 0;
  let consumedFat = 0;

  for (let i = 0; i < meals.length; i++) {
    consumedCalories += meals[i].totalCalories;
    consumedProtein += meals[i].totalProtein;
    consumedCarbs += meals[i].totalCarbs;
    consumedFat += meals[i].totalFat;
  }

  const dashboard = {
    userId: numericUserId,
    date: date,
    goals: dailyGoals,
    consumed: {
      calories: Number(consumedCalories.toFixed(1)),
      protein: Number(consumedProtein.toFixed(1)),
      carbs: Number(consumedCarbs.toFixed(1)),
      fat: Number(consumedFat.toFixed(1))
    },
    remaining: {
      calories: Number((dailyGoals.calories - consumedCalories).toFixed(1)),
      protein: Number((dailyGoals.protein - consumedProtein).toFixed(1)),
      carbs: Number((dailyGoals.carbs - consumedCarbs).toFixed(1)),
      fat: Number((dailyGoals.fat - consumedFat).toFixed(1))
    },
    meals: meals
  };

  return successResponse(res, 200, dashboard);
}

module.exports = {
  getTodayDashboard
};
