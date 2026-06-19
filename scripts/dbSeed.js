const { sequelize, User, Admin, Food, Meal, MealItem } = require("../models/orm");
const { getLocalDateString } = require("../utils/dateHelper");

const demoUsers = [
  { userId: 1, firstName: "Denis", lastName: "Kulman", userRole: "admin" },
  { userId: 2, firstName: "Yael", lastName: "Durahly", userRole: "user" },
  { userId: 3, firstName: "Amit", lastName: "Levi", userRole: "manager" }
];

const demoFoods = [
  { foodName: "chicken breast", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { foodName: "white rice", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { foodName: "salad", caloriesPer100g: 25, proteinPer100g: 1.2, carbsPer100g: 4, fatPer100g: 0.2 }
];

const demoMealItems = [
  { foodName: "chicken breast", confirmedPortionGrams: 180, calories: 297, protein: 55.8, carbs: 0, fat: 6.5 },
  { foodName: "white rice", confirmedPortionGrams: 200, calories: 260, protein: 5.4, carbs: 56, fat: 0.6 },
  { foodName: "salad", confirmedPortionGrams: 100, calories: 25, protein: 1.2, carbs: 4, fat: 0.2 }
];

function calculateTotals(items) {
  return items.reduce((totals, item) => ({
    totalCalories: Number((totals.totalCalories + item.calories).toFixed(1)),
    totalProtein: Number((totals.totalProtein + item.protein).toFixed(1)),
    totalCarbs: Number((totals.totalCarbs + item.carbs).toFixed(1)),
    totalFat: Number((totals.totalFat + item.fat).toFixed(1))
  }), {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0
  });
}

async function run() {
  await sequelize.authenticate();

  const today = getLocalDateString();
  const transaction = await sequelize.transaction();

  try {
    await User.bulkCreate(demoUsers, {
      updateOnDuplicate: ["firstName", "lastName", "userRole", "updateDate"],
      transaction
    });

    await Admin.upsert({
      userId: 1,
      adminLevel: "owner"
    }, { transaction });

    for (const food of demoFoods) {
      await Food.upsert(food, { transaction });
    }

    const totals = calculateTotals(demoMealItems);
    const [meal] = await Meal.findOrCreate({
      where: {
        userId: 1,
        mealName: "seeded today chicken rice",
        mealDate: today
      },
      defaults: {
        imagePath: "uploads/seeded-today-meal.jpg",
        ...totals
      },
      transaction
    });

    await meal.update({
      imagePath: "uploads/seeded-today-meal.jpg",
      ...totals
    }, { transaction });

    await MealItem.destroy({
      where: { mealId: meal.mealId },
      transaction
    });

    for (const item of demoMealItems) {
      const food = await Food.findOne({
        where: { foodName: item.foodName },
        transaction
      });

      await MealItem.create({
        mealId: meal.mealId,
        foodId: food.foodId,
        confirmedPortionGrams: item.confirmedPortionGrams,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      }, { transaction });
    }

    await transaction.commit();
    console.log(`Seeded demo users, admin profile, foods, and today's meal (${today}).`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
