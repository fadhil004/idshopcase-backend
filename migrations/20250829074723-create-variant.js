"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Variants", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      productId: {
        type: Sequelize.INTEGER,
        references: { model: "Products", key: "id" },
        onDelete: "CASCADE",
      },
      name: Sequelize.STRING,
      price: Sequelize.DECIMAL,
      stock: Sequelize.INTEGER,
      max_images: Sequelize.INTEGER,

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Variants");
  },
};
