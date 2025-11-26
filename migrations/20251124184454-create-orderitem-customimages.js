"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("OrderItemCustomImages", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "OrderItems",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      customImageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "CustomImages",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("OrderItemCustomImages");
  },
};
