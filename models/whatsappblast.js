"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class WhatsAppBlast extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  WhatsAppBlast.init(
    {
      message: DataTypes.TEXT,
      status: {
        type: DataTypes.ENUM("pending", "sent", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "WhatsAppBlast",
    }
  );
  return WhatsAppBlast;
};
