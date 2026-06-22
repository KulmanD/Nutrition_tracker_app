const { DataTypes } = require("sequelize");
const sequelize = require("../../src/database/sequelize");

const User = sequelize.define("User", {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "user_id"
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: "first_name"
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: "last_name"
  },
  userRole: {
    type: DataTypes.ENUM("admin", "manager", "user"),
    allowNull: false,
    defaultValue: "user",
    field: "user_role"
  }
}, {
  tableName: "users",
  timestamps: true,
  createdAt: "createDate",
  updatedAt: "updateDate",
  underscored: true
});

module.exports = User;
