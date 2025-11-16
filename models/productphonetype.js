"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductPhoneType extends Model {}

  ProductPhoneType.init(
    {
      productId: DataTypes.INTEGER,
      phoneTypeId: DataTypes.INTEGER,
    },
    { sequelize, modelName: "ProductPhoneType" }
  );

  return ProductPhoneType;
};
