"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ProductVariants", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      productId: {
        type: Sequelize.INTEGER,
        references: { model: "Products", key: "id" },
      },
      variantId: {
        type: Sequelize.INTEGER,
        references: { model: "Variants", key: "id" },
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("ProductVariants");
  },
};
