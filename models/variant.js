"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Variant extends Model {
    static associate(models) {
      Variant.belongsTo(models.Product, { foreignKey: "productId" });
      Variant.hasMany(models.CartItem, { foreignKey: "variantId" });
      Variant.hasMany(models.OrderItem, { foreignKey: "variantId" });
    }
  }

  Variant.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      price: DataTypes.DECIMAL,
      stock: DataTypes.INTEGER,
      max_images: DataTypes.INTEGER,
    },
    { sequelize, modelName: "Variant" }
  );

  return Variant;
};
