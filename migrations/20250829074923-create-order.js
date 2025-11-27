"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Orders", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
      },
      addressId: {
        type: Sequelize.INTEGER,
        references: { model: "Addresses", key: "id" },
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "paid",
          "shipped",
          "delivered",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      total_price: Sequelize.DECIMAL,
      payment_method: Sequelize.STRING,
      tracking_number: Sequelize.STRING,
      requestId: Sequelize.STRING,

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Orders");
  },
};
