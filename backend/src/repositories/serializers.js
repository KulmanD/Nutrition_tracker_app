function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function toNumber(value) {
  return Number(value || 0);
}

function serializeUser(user) {
  const plain = user.toJSON ? user.toJSON() : user;

  return {
    userId: plain.userId,
    firstName: plain.firstName,
    lastName: plain.lastName,
    createDate: toIsoString(plain.createDate),
    updateDate: toIsoString(plain.updateDate),
    userRole: plain.userRole
  };
}

function serializeSettings(settings) {
  const plain = settings.toJSON ? settings.toJSON() : settings;

  return {
    userId: plain.userId,
    username: plain.username,
    email: plain.email,
    theme: plain.theme,
    createDate: toIsoString(plain.createDate),
    updateDate: toIsoString(plain.updateDate)
  };
}

function serializeMeal(meal) {
  const plain = meal.toJSON ? meal.toJSON() : meal;
  const mealItems = plain.items || [];

  return {
    mealId: plain.mealId,
    userId: plain.userId,
    mealName: plain.mealName,
    mealDate: plain.mealDate,
    imagePath: plain.imagePath,
    items: mealItems.map((item) => ({
      itemId: item.mealItemId,
      foodName: item.food ? item.food.foodName : item.foodName,
      confirmedPortionGrams: toNumber(item.confirmedPortionGrams),
      calories: toNumber(item.calories),
      protein: toNumber(item.protein),
      carbs: toNumber(item.carbs),
      fat: toNumber(item.fat)
    })),
    totalCalories: toNumber(plain.totalCalories),
    totalProtein: toNumber(plain.totalProtein),
    totalCarbs: toNumber(plain.totalCarbs),
    totalFat: toNumber(plain.totalFat),
    createDate: toIsoString(plain.createDate),
    updateDate: toIsoString(plain.updateDate)
  };
}

module.exports = {
  serializeUser,
  serializeSettings,
  serializeMeal
};
