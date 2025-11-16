"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PhoneType extends Model {
    static associate(models) {
      PhoneType.belongsToMany(models.Product, {
        through: "ProductPhoneTypes",
        foreignKey: "phoneTypeId",
      });
    }
  }

  PhoneType.init(
    {
      brand: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PhoneType",
    }
  );

  return PhoneType;
};
