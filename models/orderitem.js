"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      OrderItem.belongsTo(models.Order, { foreignKey: "orderId" });
      OrderItem.belongsTo(models.Product, { foreignKey: "productId" });
      OrderItem.belongsTo(models.PhoneType, { foreignKey: "phoneTypeId" });
      OrderItem.belongsTo(models.Variant, { foreignKey: "variantId" });
      OrderItem.belongsToMany(models.CustomImage, {
        through: models.OrderItemCustomImages,
        foreignKey: "orderItemId",
        otherKey: "customImageId",
      });
    }
  }
  OrderItem.init(
    {
      orderId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      customImageId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      price: DataTypes.DECIMAL,
      phoneTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      variantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
    }
  );
  return OrderItem;
};
