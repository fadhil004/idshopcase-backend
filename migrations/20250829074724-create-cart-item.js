"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("CartItems", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      cartId: {
        type: Sequelize.INTEGER,
        references: { model: "Carts", key: "id" },
        onDelete: "CASCADE",
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
    await queryInterface.dropTable("CartItems");
  },
};
