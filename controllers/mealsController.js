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

    const nutrients = ['calories', 'protein', 'carbs', 'fat'];

    for (const n of nutrients) {
      if (req.body.items[i][n] === undefined || req.body.items[i][n] === null) {
        return {
          isValid: false,
          field: `items[${i}].${n}`,
          message: `Missing required field: ${n}`
        };
      }

      const val = Number(req.body.items[i][n]);
      if (isNaN(val) || val < 0) {
        return {
          isValid: false,
          field: `items[${i}].${n}`,
          message: `${n} must be a positive number.`
        };
      }
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
    const mealsForUser = [];

    for (let i = 0; i < meals.length; i++) {
      const currentMeal = meals[i];

      if (currentMeal.userId === userId) {
        mealsForUser.push(currentMeal);
      }
    }

    meals = mealsForUser;
  }

  if (req.query.date) {
    const mealsForDate = [];

    for (let i = 0; i < meals.length; i++) {
      const currentMeal = meals[i];

      if (currentMeal.mealDate === req.query.date) {
        mealsForDate.push(currentMeal);
      }
    }

    meals = mealsForDate;
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
  const meals = getMeals();
  let meal;

  for (let i = 0; i < meals.length; i++) {
    const currentMeal = meals[i];

    if (currentMeal.mealId === mealId) {
      meal = currentMeal;
      break;
    }
  }

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
  const mealItems = [];

  for (let i = 0; i < req.body.items.length; i++) {
    const item = req.body.items[i];

    mealItems.push({
      itemId: i + 1,
      foodName: item.foodName,
      confirmedPortionGrams: Number(item.confirmedPortionGrams),
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0
    });
  }

  const newMeal = {
    mealId: getNextMealId(),
    userId: Number(req.body.userId),
    mealName: req.body.mealName,
    mealDate: req.body.mealDate,
    imagePath: req.body.imagePath || null,
    items: mealItems,
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
  let mealIndex = -1;

  for (let i = 0; i < meals.length; i++) {
    const currentMeal = meals[i];

    if (currentMeal.mealId === mealId) {
      mealIndex = i;
      break;
    }
  }

  if (mealIndex === -1) {
    return errorResponse(res, 404, "MEAL_NOT_FOUND", "Meal was not found.", {
      mealId: mealId
    });
  }

  const totals = calculateTotals(req.body.items);
  const mealItems = [];

  for (let i = 0; i < req.body.items.length; i++) {
    const item = req.body.items[i];

    mealItems.push({
      itemId: i + 1,
      foodName: item.foodName,
      confirmedPortionGrams: Number(item.confirmedPortionGrams),
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0
    });
  }

  const existingMeal = meals[mealIndex];
  const updatedMeal = {};

  for (const key in existingMeal) {
    if (Object.prototype.hasOwnProperty.call(existingMeal, key)) {
      updatedMeal[key] = existingMeal[key];
    }
  }

  updatedMeal.userId = Number(req.body.userId);
  updatedMeal.mealName = req.body.mealName;
  updatedMeal.mealDate = req.body.mealDate;
  updatedMeal.imagePath = req.body.imagePath || null;
  updatedMeal.items = mealItems;
  updatedMeal.totalCalories = totals.totalCalories;
  updatedMeal.totalProtein = totals.totalProtein;
  updatedMeal.totalCarbs = totals.totalCarbs;
  updatedMeal.totalFat = totals.totalFat;
  updatedMeal.updateDate = new Date().toISOString();

  meals[mealIndex] = updatedMeal;

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
  let mealExists = false;

  for (let i = 0; i < meals.length; i++) {
    const currentMeal = meals[i];

    if (currentMeal.mealId === mealId) {
      mealExists = true;
      break;
    }
  }

  if (!mealExists) {
    return errorResponse(res, 404, "MEAL_NOT_FOUND", "Meal was not found.", {
      mealId: mealId
    });
  }

  const filteredMeals = [];

  for (let i = 0; i < meals.length; i++) {
    const currentMeal = meals[i];

    if (currentMeal.mealId !== mealId) {
      filteredMeals.push(currentMeal);
    }
  }

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
