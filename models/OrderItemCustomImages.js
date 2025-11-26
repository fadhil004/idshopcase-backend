"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderItemCustomImages extends Model {
    static associate(models) {}
  }

  OrderItemCustomImages.init(
    {
      orderItemId: DataTypes.INTEGER,
      customImageId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "OrderItemCustomImages",
      tableName: "OrderItemCustomImages",
    }
  );

  return OrderItemCustomImages;
};
