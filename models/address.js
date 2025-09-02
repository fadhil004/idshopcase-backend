"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Address.belongsTo(models.User, { foreignKey: "userId" });
      Address.hasMany(models.Order, { foreignKey: "addressId" });
    }
  }
  Address.init(
    {
      userId: DataTypes.INTEGER,
      recipient_name: DataTypes.STRING,
      phone: DataTypes.STRING,
      province: DataTypes.TEXT,
      city: DataTypes.TEXT,
      district: DataTypes.TEXT,
      sub_district: DataTypes.TEXT,
      postal_code: DataTypes.STRING,
      details: DataTypes.TEXT,
      is_primary: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Address",
    }
  );
  return Address;
};
