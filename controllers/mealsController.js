const { getMeals, setMeals, getNextMealId } = require("../models/mealsData");
const { successResponse, errorResponse } = require("../utils/responseHelper");

function isValidNumericId(id) {
  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0;
}

function calculateTotals(items) {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (let i = 0; i < items.length; i++) {
    totalCalories += Number(items[i].calories) || 0;
    totalProtein += Number(items[i].protein) || 0;
    totalCarbs += Number(items[i].carbs) || 0;
    totalFat += Number(items[i].fat) || 0;
  }

  return {
    totalCalories: Number(totalCalories.toFixed(1)),
    totalProtein: Number(totalProtein.toFixed(1)),
    totalCarbs: Number(totalCarbs.toFixed(1)),
    totalFat: Number(totalFat.toFixed(1))
  };
}

function validateMealBody(body) {
  if (!body.userId) {
    return {
      isValid: false,
      field: "userId",
      message: "Missing required field: userId"
    };
  }

  if (!body.mealName) {
    return {
      isValid: false,
      field: "mealName",
      message: "Missing required field: mealName"
    };
  }

  if (!body.mealDate) {
    return {
      isValid: false,
      field: "mealDate",
      message: "Missing required field: mealDate"
    };
  }

  if (!Array.isArray(body.items)) {
    return {
      isValid: false,
      field: "items",
      message: "Missing required field: items must be an array"
    };
  }

  if (body.items.length === 0) {
    return {
      isValid: false,
      field: "items",
      message: "Meal must include at least one food item"
    };
  }

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];

    if (!item.foodName) {
      return {
        isValid: false,
        field: `items[${i}].foodName`,
        message: "Missing required field: foodName"
      };
    }

    if (!item.confirmedPortionGrams) {
      return {
        isValid: false,
        field: `items[${i}].confirmedPortionGrams`,
        message: "Missing required field: confirmedPortionGrams"
      };
    }
  }

  return {
    isValid: true
  };
}

function getAllMeals(req, res) {
  let meals = getMeals();

  if (req.query.userId) {
    if (!isValidNumericId(req.query.userId)) {
      return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid userId query parameter.", {
        field: "userId",
        value: req.query.userId
      });
    }

    const userId = Number(req.query.userId);
    meals = meals.filter((meal) => meal.userId === userId);
  }

  if (req.query.date) {
    meals = meals.filter((meal) => meal.mealDate === req.query.date);
  }

  return successResponse(res, 200, meals);
}

function getMealById(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid meal id.", {
      field: "id",
      value: id
    });
  }

  const mealId = Number(id);
  const meal = getMeals().find((currentMeal) => currentMeal.mealId === mealId);

  if (!meal) {
    return errorResponse(res, 404, "MEAL_NOT_FOUND", "Meal was not found.", {
      mealId: mealId
    });
  }

  return successResponse(res, 200, meal);
}

function createMeal(req, res) {
  const validation = validateMealBody(req.body);

  if (!validation.isValid) {
    return errorResponse(res, 400, "VALIDATION_ERROR", validation.message, {
      field: validation.field
    });
  }

  const now = new Date().toISOString();
  const totals = calculateTotals(req.body.items);

  const newMeal = {
    mealId: getNextMealId(),
    userId: Number(req.body.userId),
    mealName: req.body.mealName,
    mealDate: req.body.mealDate,
    imagePath: req.body.imagePath || null,
    items: req.body.items.map((item, index) => {
      return {
        itemId: index + 1,
        foodName: item.foodName,
        confirmedPortionGrams: Number(item.confirmedPortionGrams),
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0
      };
    }),
    totalCalories: totals.totalCalories,
    totalProtein: totals.totalProtein,
    totalCarbs: totals.totalCarbs,
    totalFat: totals.totalFat,
    createDate: now,
    updateDate: now
  };

  const meals = getMeals();
  meals.push(newMeal);

  return successResponse(res, 201, {
    mealId: newMeal.mealId
  });
}

function updateMeal(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid meal id.", {
      field: "id",
      value: id
    });
  }

  const validation = validateMealBody(req.body);

  if (!validation.isValid) {
    return errorResponse(res, 400, "VALIDATION_ERROR", validation.message, {
      field: validation.field
    });
  }

  const mealId = Number(id);
  const meals = getMeals();
  const mealIndex = meals.findIndex((meal) => meal.mealId === mealId);

  if (mealIndex === -1) {
    return errorResponse(res, 404, "MEAL_NOT_FOUND", "Meal was not found.", {
      mealId: mealId
    });
  }

  const totals = calculateTotals(req.body.items);

  meals[mealIndex] = {
    ...meals[mealIndex],
    userId: Number(req.body.userId),
    mealName: req.body.mealName,
    mealDate: req.body.mealDate,
    imagePath: req.body.imagePath || null,
    items: req.body.items.map((item, index) => {
      return {
        itemId: index + 1,
        foodName: item.foodName,
        confirmedPortionGrams: Number(item.confirmedPortionGrams),
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0
      };
    }),
    totalCalories: totals.totalCalories,
    totalProtein: totals.totalProtein,
    totalCarbs: totals.totalCarbs,
    totalFat: totals.totalFat,
    updateDate: new Date().toISOString()
  };

  return successResponse(res, 200, {
    mealId: mealId
  });
}

function deleteMeal(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid meal id.", {
      field: "id",
      value: id
    });
  }

  const mealId = Number(id);
  const meals = getMeals();
  const mealExists = meals.some((meal) => meal.mealId === mealId);

  if (!mealExists) {
    return errorResponse(res, 404, "MEAL_NOT_FOUND", "Meal was not found.", {
      mealId: mealId
    });
  }

  const filteredMeals = meals.filter((meal) => meal.mealId !== mealId);
  setMeals(filteredMeals);

  return successResponse(res, 200, {
    mealId: mealId
  });
}

module.exports = {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal
};