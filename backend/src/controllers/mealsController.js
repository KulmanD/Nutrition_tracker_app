const mealRepository = require("../repositories/mealRepository");
const { emitDashboardUpdated, emitMealCreated } = require("../realtime/socketServer");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");
const { getLocalDateString } = require("../utils/dateHelper");

function isValidNumericId(id) {
  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0;
}

function validateMealBody(body) {
  if (!body.userId) {
    return { isValid: false, field: "userId", message: "Missing required field: userId" };
  }

  if (!body.mealName) {
    return { isValid: false, field: "mealName", message: "Missing required field: mealName" };
  }

  if (!body.mealDate) {
    return { isValid: false, field: "mealDate", message: "Missing required field: mealDate" };
  }

  if (!Array.isArray(body.items)) {
    return { isValid: false, field: "items", message: "Missing required field: items must be an array" };
  }

  if (body.items.length === 0) {
    return { isValid: false, field: "items", message: "Meal must include at least one food item" };
  }

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];

    if (!item.foodName) {
      return { isValid: false, field: `items[${i}].foodName`, message: "Missing required field: foodName" };
    }

    if (!item.confirmedPortionGrams) {
      return {
        isValid: false,
        field: `items[${i}].confirmedPortionGrams`,
        message: "Missing required field: confirmedPortionGrams"
      };
    }

    const nutrients = ["calories", "protein", "carbs", "fat"];

    for (const nutrient of nutrients) {
      if (item[nutrient] === undefined || item[nutrient] === null) {
        return {
          isValid: false,
          field: `items[${i}].${nutrient}`,
          message: `Missing required field: ${nutrient}`
        };
      }

      const value = Number(item[nutrient]);
      if (Number.isNaN(value) || value < 0) {
        return {
          isValid: false,
          field: `items[${i}].${nutrient}`,
          message: `${nutrient} must be a positive number.`
        };
      }
    }
  }

  return { isValid: true };
}

function validationError(message, field, value) {
  throw new AppError(400, "VALIDATION_ERROR", message, {
    field,
    value
  });
}

function getCurrentUserId(req) {
  const userId = Number(req.currentUserId || req.header("x-user-id"));

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Missing or invalid current user id.", {
      field: "x-user-id"
    });
  }

  return userId;
}

function buildTotalsPayload(items) {
  const totals = mealRepository.calculateTotals(items);

  return {
    calories: totals.totalCalories,
    protein: totals.totalProtein,
    carbs: totals.totalCarbs,
    fat: totals.totalFat
  };
}

function emitMealSavedEvents(meal) {
  const totals = {
    calories: meal.totalCalories,
    protein: meal.totalProtein,
    carbs: meal.totalCarbs,
    fat: meal.totalFat
  };

  emitMealCreated({
    mealId: meal.mealId,
    userId: meal.userId,
    mealDate: meal.mealDate,
    mealName: meal.mealName,
    totals
  });
  emitDashboardUpdated({
    userId: meal.userId,
    date: meal.mealDate,
    mealId: meal.mealId
  });
}

async function getAllMeals(req, res) {
  const filters = {};

  if (req.query.userId) {
    if (!isValidNumericId(req.query.userId)) {
      validationError("Invalid userId query parameter.", "userId", req.query.userId);
    }

    filters.userId = Number(req.query.userId);
  }

  if (req.query.date) {
    filters.date = req.query.date;
  }

  const meals = await mealRepository.getAllMeals(filters);
  return successResponse(res, 200, meals);
}

async function getMealById(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    validationError("Invalid meal id.", "id", id);
  }

  const mealId = Number(id);
  const meal = await mealRepository.getMealById(mealId);

  if (!meal) {
    throw new AppError(404, "MEAL_NOT_FOUND", "Meal was not found.", {
      mealId
    });
  }

  return successResponse(res, 200, meal);
}

async function createMeal(req, res) {
  const validation = validateMealBody(req.body);

  if (!validation.isValid) {
    throw new AppError(400, "VALIDATION_ERROR", validation.message, {
      field: validation.field
    });
  }

  const created = await mealRepository.createMeal(req.body);

  if (!created) {
    throw new AppError(404, "USER_NOT_FOUND", "Cannot create a meal for a non-existent user.", {
      userId: Number(req.body.userId)
    });
  }

  const userId = Number(req.body.userId);
  const totals = buildTotalsPayload(req.body.items);

  emitMealCreated({
    mealId: created.mealId,
    userId,
    mealDate: req.body.mealDate,
    mealName: req.body.mealName,
    totals
  });
  emitDashboardUpdated({
    userId,
    date: req.body.mealDate,
    mealId: created.mealId
  });

  return successResponse(res, 201, {
    mealId: created.mealId
  });
}

async function createMealFromAi(req, res) {
  if (!req.body.analysisId || typeof req.body.analysisId !== "string" || req.body.analysisId.trim().length === 0) {
    validationError("Missing required field: analysisId", "analysisId");
  }

  const userId = getCurrentUserId(req);
  const mealDate = req.body.mealDate || getLocalDateString();
  const validation = validateMealBody({
    ...req.body,
    userId,
    mealDate
  });

  if (!validation.isValid) {
    throw new AppError(400, "VALIDATION_ERROR", validation.message, {
      field: validation.field
    });
  }

  const meal = await mealRepository.createMealAndReturn({
    userId,
    mealName: req.body.mealName,
    mealDate,
    imagePath: req.body.imagePath || null,
    items: req.body.items
  });

  if (!meal) {
    throw new AppError(404, "USER_NOT_FOUND", "Cannot create a meal for a non-existent user.", {
      userId
    });
  }

  emitMealSavedEvents(meal);

  return successResponse(res, 201, {
    mealId: meal.mealId,
    meal
  });
}

async function updateMeal(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    validationError("Invalid meal id.", "id", id);
  }

  const validation = validateMealBody(req.body);

  if (!validation.isValid) {
    throw new AppError(400, "VALIDATION_ERROR", validation.message, {
      field: validation.field
    });
  }

  const mealId = Number(id);
  const updated = await mealRepository.updateMeal(mealId, req.body);

  if (!updated) {
    throw new AppError(404, "MEAL_NOT_FOUND", "Meal was not found.", {
      mealId
    });
  }

  return successResponse(res, 200, {
    mealId
  });
}

async function deleteMeal(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    validationError("Invalid meal id.", "id", id);
  }

  const mealId = Number(id);
  const deleted = await mealRepository.deleteMeal(mealId);

  if (!deleted) {
    throw new AppError(404, "MEAL_NOT_FOUND", "Meal was not found.", {
      mealId
    });
  }

  return successResponse(res, 200, {
    mealId
  });
}

module.exports = {
  getAllMeals,
  getMealById,
  createMeal,
  createMealFromAi,
  updateMeal,
  deleteMeal
};
