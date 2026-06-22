const { DataTypes } = require("sequelize");
const sequelize = require("../../src/database/sequelize");

const Admin = sequelize.define("Admin", {
  adminId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "admin_id"
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: "user_id"
  },
  adminLevel: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "standard",
    field: "admin_level"
  }
}, {
  tableName: "admins",
  timestamps: true,
  createdAt: "createDate",
  updatedAt: "updateDate",
  underscored: true
});

module.exports = Admin;
