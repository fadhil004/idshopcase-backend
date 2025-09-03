"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Address, { foreignKey: "userId" });
      User.hasMany(models.CustomImage, { foreignKey: "userId" });
      User.hasOne(models.Cart, { foreignKey: "userId" });
      User.hasMany(models.Order, { foreignKey: "userId" });
      User.hasMany(models.Notification, { foreignKey: "userId" });
    }
  }

  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      phone: DataTypes.STRING,
      profile_picture: DataTypes.STRING,
      role: {
        type: DataTypes.ENUM("customer", "admin"),
        allowNull: false,
        defaultValue: "customer",
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  return User;
};
