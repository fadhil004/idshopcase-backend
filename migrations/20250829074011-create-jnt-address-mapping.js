"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("JntAddressMappings", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      province: Sequelize.STRING,
      city: Sequelize.STRING,
      district: Sequelize.STRING,
      jnt_province: Sequelize.STRING,
      jnt_city: Sequelize.STRING,
      jnt_city_code: Sequelize.STRING,
      jnt_district: Sequelize.STRING,
      jnt_area_code: Sequelize.STRING,

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("JntAddressMappings");
  },
};
