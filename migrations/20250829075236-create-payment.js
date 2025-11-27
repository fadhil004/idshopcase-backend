"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Payments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        references: { model: "Orders", key: "id" },
      },
      payment_gateway: Sequelize.STRING,
      transaction_id: Sequelize.STRING,
      status: {
        type: Sequelize.ENUM("pending", "success", "failed", "expired"),
        defaultValue: "pending",
      },
      amount: Sequelize.DECIMAL,

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Payments");
  },
};
