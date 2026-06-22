const { DataTypes } = require("sequelize");
const sequelize = require("../../src/database/sequelize");

const Food = sequelize.define("Food", {
  foodId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "food_id"
  },
  foodName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    field: "food_name"
  },
  caloriesPer100g: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0,
    field: "calories_per_100g"
  },
  proteinPer100g: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0,
    field: "protein_per_100g"
  },
  carbsPer100g: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0,
    field: "carbs_per_100g"
  },
  fatPer100g: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    defaultValue: 0,
    field: "fat_per_100g"
  }
}, {
  tableName: "foods",
  timestamps: true,
  createdAt: "createDate",
  updatedAt: "updateDate",
  underscored: true
});

module.exports = Food;
