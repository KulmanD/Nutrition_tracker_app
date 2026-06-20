const { sequelize, User, Admin, Food, Meal, MealItem, UserSetting } = require("../models/orm");
const { getLocalDateString } = require("../utils/dateHelper");

const demoUsers = [
  { userId: 1, firstName: "Denis", lastName: "Kulman", userRole: "admin" },
  { userId: 2, firstName: "Yael", lastName: "Durahly", userRole: "user" },
  { userId: 3, firstName: "Amit", lastName: "Levi", userRole: "manager" }
];

const demoFoods = [
  { foodName: "greek yogurt", caloriesPer100g: 60, proteinPer100g: 10, carbsPer100g: 4, fatPer100g: 0 },
  { foodName: "banana", caloriesPer100g: 87.5, proteinPer100g: 1.1, carbsPer100g: 22.5, fatPer100g: 0.3 },
  { foodName: "chicken breast", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { foodName: "pasta", caloriesPer100g: 156, proteinPer100g: 5.2, carbsPer100g: 31.2, fatPer100g: 0.8 },
  { foodName: "tomato sauce", caloriesPer100g: 70, proteinPer100g: 2, carbsPer100g: 12, fatPer100g: 2 },
  { foodName: "white rice", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { foodName: "salad", caloriesPer100g: 25, proteinPer100g: 1.2, carbsPer100g: 4, fatPer100g: 0.2 }
];

const demoSettings = [
  { userId: 1, username: "Denis Kulman", email: "denis@example.com", theme: "light" },
  { userId: 2, username: "Yael Durahly", email: "yael@example.com", theme: "dark" },
  { userId: 3, username: "Amit Levi", email: "amit@example.com", theme: "dark" }
];

const legacyMeals = [
  {
    mealId: 1,
    userId: 1,
    mealName: "chicken rice lunch",
    mealDate: "2026-05-06",
    imagePath: "uploads/chicken-rice.jpg",
    items: [
      { foodName: "chicken breast", confirmedPortionGrams: 180, calories: 297, protein: 55.8, carbs: 0, fat: 6.5 },
      { foodName: "white rice", confirmedPortionGrams: 200, calories: 260, protein: 5.4, carbs: 56, fat: 0.6 }
    ]
  },
  {
    mealId: 2,
    userId: 1,
    mealName: "breakfast yogurt bowl",
    mealDate: "2026-05-06",
    imagePath: "uploads/yogurt-bowl.jpg",
    items: [
      { foodName: "greek yogurt", confirmedPortionGrams: 250, calories: 150, protein: 25, carbs: 10, fat: 0 },
      { foodName: "banana", confirmedPortionGrams: 120, calories: 105, protein: 1.3, carbs: 27, fat: 0.4 }
    ]
  },
  {
    mealId: 3,
    userId: 2,
    mealName: "pasta dinner",
    mealDate: "2026-05-06",
    imagePath: "uploads/pasta.jpg",
    items: [
      { foodName: "pasta", confirmedPortionGrams: 250, calories: 390, protein: 13, carbs: 78, fat: 2 },
      { foodName: "tomato sauce", confirmedPortionGrams: 100, calories: 70, protein: 2, carbs: 12, fat: 2 }
    ]
  }
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

  const reset = process.argv.includes("--reset");
  const today = getLocalDateString();
  const transaction = await sequelize.transaction();

  try {
    if (reset) {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { transaction });
      await MealItem.destroy({ truncate: true, force: true, transaction });
      await Meal.destroy({ truncate: true, force: true, transaction });
      await Food.destroy({ truncate: true, force: true, transaction });
      await UserSetting.destroy({ truncate: true, force: true, transaction });
      await Admin.destroy({ truncate: true, force: true, transaction });
      await User.destroy({ truncate: true, force: true, transaction });
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { transaction });
    }

    await User.bulkCreate(demoUsers, {
      updateOnDuplicate: ["firstName", "lastName", "userRole", "updateDate"],
      transaction
    });

    await Admin.upsert({
      userId: 1,
      adminLevel: "owner"
    }, { transaction });

    await UserSetting.bulkCreate(demoSettings, {
      updateOnDuplicate: ["username", "email", "theme", "updateDate"],
      transaction
    });

    for (const food of demoFoods) {
      await Food.upsert(food, { transaction });
    }

    const seededMeals = legacyMeals.concat([{
      mealId: 4,
      userId: 1,
      mealName: "seeded today chicken rice",
      mealDate: today,
      imagePath: "uploads/seeded-today-meal.jpg",
      items: [
        { foodName: "chicken breast", confirmedPortionGrams: 180, calories: 297, protein: 55.8, carbs: 0, fat: 6.5 },
        { foodName: "white rice", confirmedPortionGrams: 200, calories: 260, protein: 5.4, carbs: 56, fat: 0.6 },
        { foodName: "salad", confirmedPortionGrams: 100, calories: 25, protein: 1.2, carbs: 4, fat: 0.2 }
      ]
    }]);

    for (const seededMeal of seededMeals) {
      const totals = calculateTotals(seededMeal.items);
      const [meal] = await Meal.findOrCreate({
        where: { mealId: seededMeal.mealId },
        defaults: {
          mealId: seededMeal.mealId,
          userId: seededMeal.userId,
          mealName: seededMeal.mealName,
          mealDate: seededMeal.mealDate,
          imagePath: seededMeal.imagePath,
          ...totals
        },
        transaction
      });

      await meal.update({
        userId: seededMeal.userId,
        mealName: seededMeal.mealName,
        mealDate: seededMeal.mealDate,
        imagePath: seededMeal.imagePath,
        ...totals
      }, { transaction });

      await MealItem.destroy({
        where: { mealId: meal.mealId },
        transaction
      });

      for (const item of seededMeal.items) {
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
    }

    await transaction.commit();
    console.log(`Seeded demo users, settings, admin profile, foods, legacy meals, and today's meal (${today}).`);
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
