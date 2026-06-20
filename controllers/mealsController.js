const mealRepository = require("../repositories/mealRepository");
const { emitDashboardUpdated, emitMealCreated } = require("../realtime/socketServer");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");

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
  const totals = mealRepository.calculateTotals(req.body.items);

  emitMealCreated({
    mealId: created.mealId,
    userId,
    mealDate: req.body.mealDate,
    mealName: req.body.mealName,
    totals: {
      calories: totals.totalCalories,
      protein: totals.totalProtein,
      carbs: totals.totalCarbs,
      fat: totals.totalFat
    }
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
  updateMeal,
  deleteMeal
};
