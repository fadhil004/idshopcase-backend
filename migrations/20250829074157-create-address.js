"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Addresses", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      recipient_name: Sequelize.STRING,
      phone: Sequelize.STRING,
      province: Sequelize.TEXT,
      city: Sequelize.TEXT,
      district: Sequelize.TEXT,
      postal_code: Sequelize.STRING,
      details: Sequelize.TEXT,
      is_primary: Sequelize.BOOLEAN,

      jntAddressMappingId: {
        type: Sequelize.INTEGER,
        references: { model: "JntAddressMappings", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Addresses");
  },
};
