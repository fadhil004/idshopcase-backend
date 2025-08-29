"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Payment.init(
    {
      orderId: DataTypes.INTEGER,
      payment_gateway: DataTypes.STRING,
      transaction_id: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM("pending", "success", "failed", "expired"),
        allowNull: false,
        defaultValue: "pending",
      },
      amount: DataTypes.DECIMAL,
    },
    {
      sequelize,
      modelName: "Payment",
    }
  );
  return Payment;
};
