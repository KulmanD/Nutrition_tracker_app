const { sequelize, Food, Meal, MealItem, User } = require("../models/orm");
const { serializeMeal } = require("./serializers");

function calculateTotals(items) {
  return items.reduce((totals, item) => ({
    totalCalories: Number((totals.totalCalories + (Number(item.calories) || 0)).toFixed(1)),
    totalProtein: Number((totals.totalProtein + (Number(item.protein) || 0)).toFixed(1)),
    totalCarbs: Number((totals.totalCarbs + (Number(item.carbs) || 0)).toFixed(1)),
    totalFat: Number((totals.totalFat + (Number(item.fat) || 0)).toFixed(1))
  }), {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0
  });
}

function per100(value, grams) {
  const numericValue = Number(value) || 0;
  const numericGrams = Number(grams) || 0;

  if (numericGrams <= 0) {
    return numericValue;
  }

  return Number(((numericValue / numericGrams) * 100).toFixed(1));
}

function mealInclude() {
  return [{
    model: MealItem,
    as: "items",
    include: [{
      model: Food,
      as: "food"
    }]
  }];
}

async function findFoodForItem(item, transaction) {
  const [food] = await Food.findOrCreate({
    where: { foodName: item.foodName },
    defaults: {
      foodName: item.foodName,
      caloriesPer100g: per100(item.calories, item.confirmedPortionGrams),
      proteinPer100g: per100(item.protein, item.confirmedPortionGrams),
      carbsPer100g: per100(item.carbs, item.confirmedPortionGrams),
      fatPer100g: per100(item.fat, item.confirmedPortionGrams)
    },
    transaction
  });

  return food;
}

async function writeMealItems(mealId, items, transaction) {
  for (const item of items) {
    const food = await findFoodForItem(item, transaction);

    await MealItem.create({
      mealId,
      foodId: food.foodId,
      confirmedPortionGrams: Number(item.confirmedPortionGrams),
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0
    }, { transaction });
  }
}

async function getAllMeals(filters = {}) {
  const where = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.date) {
    where.mealDate = filters.date;
  }

  const meals = await Meal.findAll({
    where,
    include: mealInclude(),
    order: [
      ["mealId", "ASC"],
      [{ model: MealItem, as: "items" }, "mealItemId", "ASC"]
    ]
  });

  return meals.map(serializeMeal);
}

async function getMealById(mealId) {
  const meal = await Meal.findByPk(mealId, {
    include: mealInclude(),
    order: [[{ model: MealItem, as: "items" }, "mealItemId", "ASC"]]
  });

  return meal ? serializeMeal(meal) : null;
}

async function createMeal(data) {
  const user = await User.findByPk(data.userId);

  if (!user) {
    return null;
  }

  const totals = calculateTotals(data.items);

  return sequelize.transaction(async (transaction) => {
    const meal = await Meal.create({
      userId: Number(data.userId),
      mealName: data.mealName,
      mealDate: data.mealDate,
      imagePath: data.imagePath || null,
      ...totals
    }, { transaction });

    await writeMealItems(meal.mealId, data.items, transaction);
    return { mealId: meal.mealId };
  });
}

async function updateMeal(mealId, data) {
  const meal = await Meal.findByPk(mealId);

  if (!meal) {
    return null;
  }

  const user = await User.findByPk(data.userId);

  if (!user) {
    return null;
  }

  const totals = calculateTotals(data.items);

  await sequelize.transaction(async (transaction) => {
    await meal.update({
      userId: Number(data.userId),
      mealName: data.mealName,
      mealDate: data.mealDate,
      imagePath: data.imagePath || null,
      ...totals
    }, { transaction });

    await MealItem.destroy({
      where: { mealId },
      transaction
    });
    await writeMealItems(mealId, data.items, transaction);
  });

  return { mealId };
}

async function deleteMeal(mealId) {
  const deleted = await Meal.destroy({
    where: { mealId }
  });

  return deleted > 0;
}

module.exports = {
  calculateTotals,
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal
};
