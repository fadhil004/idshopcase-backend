'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CustomImage.init({
    userId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    image_url: DataTypes.STRING,
    processed_url: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CustomImage',
  });
  return CustomImage;
};