const { getMeals } = require("../models/mealsData"); //grab meals
const { successResponse, errorResponse } = require("../utils/responseHelper"); //grab helpers
const { getUsers } = require("../models/usersData"); //grab users


function isValidNumericId(id) { //check if id is a good number
  const parsedId = Number(id); //make it a number
  return Number.isInteger(parsedId) && parsedId > 0; //must be positive whole number
}

function getTodayDashboard(req, res) { //get stats for today
  const userId = req.query.userId; //who is asking
  const date = req.query.date || "2026-05-06"; //what day (default to may 6)

  if (!userId) { //if no user given
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required query parameter: userId", { //send error
      field: "userId"
    });
  }

  if (!isValidNumericId(userId)) { //if bad user id
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid userId query parameter.", { //send error
      field: "userId",
      value: userId
    });
  }

  const numericUserId = Number(userId); //make sure it's a number

  const dailyGoals = { //fake daily goals
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 70
  };

  const allUsers = getUsers(); //get all users
  const userExists = allUsers.some(u => u.userId === numericUserId); //make sure user exists

  if (!userExists) { //if not exist
    return errorResponse(res, 404, "USER_NOT_FOUND", "Cannot generate dashboard for a non-existent user.", { userId: numericUserId }); //send error
  }


  const allMeals = getMeals(); //get all meals
  const meals = []; //empty list for today

  for (let i = 0; i < allMeals.length; i++) { //loop through meals
    const currentMeal = allMeals[i]; //grab this meal

    if (currentMeal.userId === numericUserId && currentMeal.mealDate === date) { //if it's theirs and today
      meals.push(currentMeal); //add to our list
    }
  }

  let consumedCalories = 0; //start counting
  let consumedProtein = 0;
  let consumedCarbs = 0;
  let consumedFat = 0;

  for (let i = 0; i < meals.length; i++) { //loop through today's meals
    consumedCalories += meals[i].totalCalories; //add it up
    consumedProtein += meals[i].totalProtein;
    consumedCarbs += meals[i].totalCarbs;
    consumedFat += meals[i].totalFat;
  }

  const dashboard = { //build the dashboard info
    userId: numericUserId, //user id
    date: date, //date
    goals: dailyGoals, //daily goals
    consumed: { //what user ate
      calories: Number(consumedCalories.toFixed(1)),
      protein: Number(consumedProtein.toFixed(1)),
      carbs: Number(consumedCarbs.toFixed(1)),
      fat: Number(consumedFat.toFixed(1))
    },
    remaining: { //what's left
      calories: Number((dailyGoals.calories - consumedCalories).toFixed(1)),
      protein: Number((dailyGoals.protein - consumedProtein).toFixed(1)),
      carbs: Number((dailyGoals.carbs - consumedCarbs).toFixed(1)),
      fat: Number((dailyGoals.fat - consumedFat).toFixed(1))
    },
    meals: meals //the actual meals
  };

  return successResponse(res, 200, dashboard); //send success with dashboard
}

module.exports = { //share our dashboard function
  getTodayDashboard
};
