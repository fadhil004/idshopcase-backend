"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JntAddressMapping extends Model {
    static associate(models) {
      // Relasi: satu mapping bisa digunakan oleh banyak address
      JntAddressMapping.hasMany(models.Address, {
        foreignKey: "jntAddressMappingId",
      });
    }
  }

  JntAddressMapping.init(
    {
      province: DataTypes.STRING,
      city: DataTypes.STRING,
      district: DataTypes.STRING,
      jnt_province: DataTypes.STRING,
      jnt_city: DataTypes.STRING,
      jnt_city_code: DataTypes.STRING,
      jnt_district: DataTypes.STRING,
      jnt_area_code: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "JntAddressMapping",
    }
  );

  return JntAddressMapping;
};
