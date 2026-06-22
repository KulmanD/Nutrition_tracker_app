const { DataTypes } = require("sequelize");
const sequelize = require("../../src/database/sequelize");

const UserSetting = sequelize.define("UserSetting", {
  settingId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "setting_id"
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: "user_id"
  },
  username: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  theme: {
    type: DataTypes.ENUM("light", "dark"),
    allowNull: false,
    defaultValue: "light"
  }
}, {
  tableName: "user_settings",
  timestamps: true,
  createdAt: "createDate",
  updatedAt: "updateDate",
  underscored: true
});

module.exports = UserSetting;
