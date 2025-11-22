"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductVariant extends Model {}

  ProductVariant.init(
    {
      productId: DataTypes.INTEGER,
      variantId: DataTypes.INTEGER,
    },
    { sequelize, modelName: "ProductVariant" }
  );

  return ProductVariant;
};
