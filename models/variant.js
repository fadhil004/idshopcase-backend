"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Variant extends Model {
    static associate(models) {
      Variant.hasMany(models.Product, { foreignKey: "variantId" });
    }
  }

  Variant.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.TEXT,
    },
    { sequelize, modelName: "Variant" }
  );

  return Variant;
};
