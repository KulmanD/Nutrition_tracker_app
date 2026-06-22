const { DataTypes } = require("sequelize");
const sequelize = require("../../src/database/sequelize");

const Meal = sequelize.define("Meal", {
  mealId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "meal_id"
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "user_id"
  },
  mealName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: "meal_name"
  },
  mealDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "meal_date"
  },
  imagePath: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: "image_path"
  },
  totalCalories: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0,
    field: "total_calories"
  },
  totalProtein: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0,
    field: "total_protein"
  },
  totalCarbs: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0,
    field: "total_carbs"
  },
  totalFat: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0,
    field: "total_fat"
  }
}, {
  tableName: "meals",
  timestamps: true,
  createdAt: "createDate",
  updatedAt: "updateDate",
  underscored: true
});

module.exports = Meal;
