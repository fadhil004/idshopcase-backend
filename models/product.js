"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Product.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      price: DataTypes.DECIMAL,
      stock: DataTypes.INTEGER,
      category: {
        type: DataTypes.ENUM(
          "custom_case",
          "keychain",
          "phone_charm",
          "pop_socket"
        ),
        allowNull: false,
      },
      material: {
        type: DataTypes.ENUM(
          "premium_softcase",
          "diamond_impact",
          "magsafe_diamond_impact_x2"
        ),
        allowNull: true,
      },

      phone_type: DataTypes.STRING,
      image: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Product",
    }
  );
  return Product;
};
