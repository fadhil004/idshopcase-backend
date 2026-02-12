"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("OrderItems", "total_price", {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("OrderItems", "total_price");
  },
};
