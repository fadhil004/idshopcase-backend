"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: "userId" });
      Order.belongsTo(models.Address, { foreignKey: "addressId" });
      Order.hasMany(models.OrderItem, { foreignKey: "orderId" });
      Order.hasOne(models.Payment, { foreignKey: "orderId" });
    }
  }
  Order.init(
    {
      userId: DataTypes.INTEGER,
      addressId: DataTypes.INTEGER,
      status: {
        type: DataTypes.ENUM(
          "pending",
          "paid",
          "shipped",
          "delivered",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      total_price: DataTypes.DECIMAL,
      payment_method: DataTypes.STRING,
      tracking_number: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Order",
    }
  );
  return Order;
};
