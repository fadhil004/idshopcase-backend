"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsToMany(models.PhoneType, {
        through: "ProductPhoneTypes",
        foreignKey: "productId",
      });
      Product.hasMany(models.Variant, { foreignKey: "productId" });
      Product.hasMany(models.CustomImage, { foreignKey: "productId" });
      Product.hasMany(models.CartItem, { foreignKey: "productId" });
      Product.hasMany(models.OrderItem, { foreignKey: "productId" });
      Product.hasMany(models.ProductImage, { foreignKey: "productId" });
    }
  }

  Product.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    { sequelize, modelName: "Product" }
  );

  return Product;
};
