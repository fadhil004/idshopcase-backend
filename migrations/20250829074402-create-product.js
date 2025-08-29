"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Products", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      price: {
        type: Sequelize.DECIMAL,
      },
      stock: {
        type: Sequelize.INTEGER,
      },
      category: {
        type: Sequelize.ENUM(
          "custom_case",
          "keychain",
          "phone_charm",
          "pop_socket"
        ),
        allowNull: false,
      },
      material: {
        type: Sequelize.ENUM(
          "premium_softcase",
          "diamond_impact",
          "magsafe_diamond_impact_x2"
        ),
        allowNull: true,
      },

      phone_type: {
        type: Sequelize.STRING,
      },
      image: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Products");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Products_category";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Products_material";'
    );
  },
};
