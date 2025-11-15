"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.PhoneType, { foreignKey: "phoneTypeId" });
      Product.belongsTo(models.Material, { foreignKey: "materialId" });
      Product.belongsTo(models.Variant, { foreignKey: "variantId" });

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
      price: DataTypes.DECIMAL,
      stock: DataTypes.INTEGER,
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phoneTypeId: {
        type: DataTypes.INTEGER,
        references: { model: "PhoneTypes", key: "id" },
      },
      materialId: {
        type: DataTypes.INTEGER,
        references: { model: "Materials", key: "id" },
      },
      variantId: {
        type: DataTypes.INTEGER,
        references: { model: "Variants", key: "id" },
      },
    },
    { sequelize, modelName: "Product" }
  );

  return Product;
};
