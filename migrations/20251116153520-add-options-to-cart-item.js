"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("CartItems", "phoneTypeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("CartItems", "variantId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("CartItems", "phoneTypeId");
    await queryInterface.removeColumn("CartItems", "variantId");
  },
};
