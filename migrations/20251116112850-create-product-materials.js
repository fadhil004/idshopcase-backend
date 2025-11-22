"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ProductMaterials", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      productId: {
        type: Sequelize.INTEGER,
        references: { model: "Products", key: "id" },
      },
      materialId: {
        type: Sequelize.INTEGER,
        references: { model: "Materials", key: "id" },
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("ProductMaterials");
  },
};
