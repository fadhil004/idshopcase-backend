"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Material extends Model {
    static associate(models) {
      Material.hasMany(models.Product, { foreignKey: "materialId" });
    }
  }

  Material.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.TEXT,
    },
    { sequelize, modelName: "Material" }
  );

  return Material;
};
