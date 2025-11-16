"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Material extends Model {
    static associate(models) {
      Material.belongsToMany(models.Product, {
        through: "ProductMaterials",
        foreignKey: "materialId",
      });
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
