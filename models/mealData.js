let meals = [
  {
    mealId: 1,
    userId: 1,
    mealName: "chicken rice lunch",
    mealDate: "2026-05-06",
    imagePath: "uploads/chicken-rice.jpg",
    items: [
      {
        itemId: 1,
        foodName: "chicken breast",
        confirmedPortionGrams: 180,
        calories: 297,
        protein: 55.8,
        carbs: 0,
        fat: 6.5
      },
      {
        itemId: 2,
        foodName: "white rice",
        confirmedPortionGrams: 200,
        calories: 260,
        protein: 5.4,
        carbs: 56,
        fat: 0.6
      }
    ],
    totalCalories: 557,
    totalProtein: 61.2,
    totalCarbs: 56,
    totalFat: 7.1,
    createDate: "2026-05-06T11:30:00.000Z",
    updateDate: "2026-05-06T11:30:00.000Z"
  },
  {
    mealId: 2,
    userId: 1,
    mealName: "breakfast yogurt bowl",
    mealDate: "2026-05-06",
    imagePath: "uploads/yogurt-bowl.jpg",
    items: [
      {
        itemId: 1,
        foodName: "greek yogurt",
        confirmedPortionGrams: 250,
        calories: 150,
        protein: 25,
        carbs: 10,
        fat: 0
      },
      {
        itemId: 2,
        foodName: "banana",
        confirmedPortionGrams: 120,
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4
      }
    ],
    totalCalories: 255,
    totalProtein: 26.3,
    totalCarbs: 37,
    totalFat: 0.4,
    createDate: "2026-05-06T08:00:00.000Z",
    updateDate: "2026-05-06T08:00:00.000Z"
  },
  {
    mealId: 3,
    userId: 2,
    mealName: "pasta dinner",
    mealDate: "2026-05-05",
    imagePath: "uploads/pasta.jpg",
    items: [
      {
        itemId: 1,
        foodName: "pasta",
        confirmedPortionGrams: 250,
        calories: 390,
        protein: 13,
        carbs: 78,
        fat: 2
      },
      {
        itemId: 2,
        foodName: "tomato sauce",
        confirmedPortionGrams: 100,
        calories: 70,
        protein: 2,
        carbs: 12,
        fat: 2
      }
    ],
    totalCalories: 460,
    totalProtein: 15,
    totalCarbs: 90,
    totalFat: 4,
    createDate: "2026-05-05T19:20:00.000Z",
    updateDate: "2026-05-05T19:20:00.000Z"
  }
];

function getMeals() {
  return meals;
}

function setMeals(newMeals) {
  meals = newMeals;
}

function getNextMealId() {
  if (meals.length === 0) {
    return 1;
  }

  return Math.max(...meals.map((meal) => meal.mealId)) + 1;
}

module.exports = {
  getMeals,
  setMeals,
  getNextMealId
};