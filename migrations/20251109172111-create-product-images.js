"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ProductImages", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      productId: {
        type: Sequelize.INTEGER,
        references: { model: "Products", key: "id" },
        onDelete: "CASCADE",
      },
      imageUrl: Sequelize.STRING,
      isPrimary: { type: Sequelize.BOOLEAN, defaultValue: false },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("ProductImages");
  },
};
