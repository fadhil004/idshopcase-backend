"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Orders", "requestId", {
      type: Sequelize.STRING,
      allowNull: true, // Allow null if requestId is not set yet
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Orders", "requestId");
  },
};
