const sequelize = require("../../database/sequelize");
const User = require("./User");
const Admin = require("./Admin");
const Food = require("./Food");
const Meal = require("./Meal");
const MealItem = require("./MealItem");

User.hasOne(Admin, {
  as: "adminProfile",
  foreignKey: "userId"
});
Admin.belongsTo(User, {
  as: "user",
  foreignKey: "userId"
});

User.hasMany(Meal, {
  as: "meals",
  foreignKey: "userId"
});
Meal.belongsTo(User, {
  as: "user",
  foreignKey: "userId"
});

Meal.belongsToMany(Food, {
  as: "foods",
  through: MealItem,
  foreignKey: "mealId",
  otherKey: "foodId"
});
Food.belongsToMany(Meal, {
  as: "meals",
  through: MealItem,
  foreignKey: "foodId",
  otherKey: "mealId"
});

Meal.hasMany(MealItem, {
  as: "items",
  foreignKey: "mealId"
});
MealItem.belongsTo(Meal, {
  as: "meal",
  foreignKey: "mealId"
});

Food.hasMany(MealItem, {
  as: "mealItems",
  foreignKey: "foodId"
});
MealItem.belongsTo(Food, {
  as: "food",
  foreignKey: "foodId"
});

module.exports = {
  sequelize,
  User,
  Admin,
  Food,
  Meal,
  MealItem
};
