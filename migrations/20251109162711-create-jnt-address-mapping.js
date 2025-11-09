"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("JntAddressMappings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      province: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      district: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jnt_province: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jnt_city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jnt_city_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jnt_district: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jnt_area_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Tambahkan kolom relasi ke Address
    await queryInterface.addColumn("Addresses", "jntAddressMappingId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "JntAddressMappings",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Addresses", "jntAddressMappingId");
    await queryInterface.dropTable("JntAddressMappings");
  },
};
