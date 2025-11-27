"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("OrderItemCustomImages", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      orderItemId: {
        type: Sequelize.INTEGER,
        references: { model: "OrderItems", key: "id" },
      },
      customImageId: {
        type: Sequelize.INTEGER,
        references: { model: "CustomImages", key: "id" },
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("OrderItemCustomImages");
  },
};
