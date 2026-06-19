const { DataTypes } = require("sequelize");
const sequelize = require("../../database/sequelize");

const MealItem = sequelize.define("MealItem", {
  mealItemId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "meal_item_id"
  },
  mealId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "meal_id"
  },
  foodId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "food_id"
  },
  confirmedPortionGrams: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    field: "confirmed_portion_grams"
  },
  calories: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0
  },
  protein: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0
  },
  carbs: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0
  },
  fat: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: "meal_items",
  timestamps: true,
  createdAt: "createDate",
  updatedAt: "updateDate",
  underscored: true
});

module.exports = MealItem;
