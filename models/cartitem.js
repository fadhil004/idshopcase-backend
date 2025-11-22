"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CartItem.belongsTo(models.Cart, { foreignKey: "cartId" });
      CartItem.belongsTo(models.Product, { foreignKey: "productId" });
      CartItem.belongsTo(models.CustomImage, { foreignKey: "customImageId" });
      CartItem.belongsTo(models.PhoneType, { foreignKey: "phoneTypeId" });
      CartItem.belongsTo(models.Material, { foreignKey: "materialId" });
      CartItem.belongsTo(models.Variant, { foreignKey: "variantId" });
    }
  }
  CartItem.init(
    {
      cartId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      customImageId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      price: DataTypes.DECIMAL,
      phoneTypeId: DataTypes.INTEGER,
      materialId: DataTypes.INTEGER,
      variantId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "CartItem",
    }
  );
  return CartItem;
};
