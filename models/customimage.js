"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CustomImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CustomImage.belongsTo(models.User, { foreignKey: "userId" });
      CustomImage.belongsTo(models.Product, { foreignKey: "productId" });
      CustomImage.hasMany(models.CartItem, { foreignKey: "customImageId" });
      CustomImage.hasMany(models.OrderItem, { foreignKey: "customImageId" });
    }
  }
  CustomImage.init(
    {
      userId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      image_url: DataTypes.STRING,
      processed_url: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "CustomImage",
    }
  );
  return CustomImage;
};
