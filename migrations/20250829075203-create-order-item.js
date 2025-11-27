"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("OrderItems", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        references: { model: "Orders", key: "id" },
      },
      productId: {
        type: Sequelize.INTEGER,
        references: { model: "Products", key: "id" },
      },
      quantity: Sequelize.INTEGER,
      price: Sequelize.DECIMAL,
      phoneTypeId: {
        type: Sequelize.INTEGER,
        references: { model: "PhoneTypes", key: "id" },
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
    await queryInterface.dropTable("OrderItems");
  },
};
