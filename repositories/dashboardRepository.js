const { User } = require("../models/orm");
const mealRepository = require("./mealRepository");

const dailyGoals = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70
};

async function getDashboard(userId, date) {
  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  const meals = await mealRepository.getAllMeals({
    userId,
    date
  });

  const consumed = meals.reduce((totals, meal) => ({
    calories: Number((totals.calories + meal.totalCalories).toFixed(1)),
    protein: Number((totals.protein + meal.totalProtein).toFixed(1)),
    carbs: Number((totals.carbs + meal.totalCarbs).toFixed(1)),
    fat: Number((totals.fat + meal.totalFat).toFixed(1))
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  return {
    userId,
    date,
    goals: dailyGoals,
    consumed,
    remaining: {
      calories: Number((dailyGoals.calories - consumed.calories).toFixed(1)),
      protein: Number((dailyGoals.protein - consumed.protein).toFixed(1)),
      carbs: Number((dailyGoals.carbs - consumed.carbs).toFixed(1)),
      fat: Number((dailyGoals.fat - consumed.fat).toFixed(1))
    },
    meals
  };
}

module.exports = {
  getDashboard
};
