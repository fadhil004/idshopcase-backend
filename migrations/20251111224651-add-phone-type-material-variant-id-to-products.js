"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Products", "phoneTypeId", {
      type: Sequelize.INTEGER,
      references: { model: "PhoneTypes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("Products", "variantId", {
      type: Sequelize.INTEGER,
      references: { model: "Variants", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Products", "phoneTypeId");
    await queryInterface.removeColumn("Products", "variantId");
  },
};
