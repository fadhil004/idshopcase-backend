"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Products", "variation", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "material",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Products", "variation");
  },
};
