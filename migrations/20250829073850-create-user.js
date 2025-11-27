"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Users", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: Sequelize.STRING,
      email: Sequelize.STRING,
      password: Sequelize.STRING,
      phone: Sequelize.STRING,
      profile_picture: Sequelize.STRING,
      role: {
        type: Sequelize.ENUM("customer", "admin"),
        allowNull: false,
        defaultValue: "customer",
      },
      resetPasswordToken: Sequelize.STRING,
      resetPasswordExpire: Sequelize.DATE,
      otp_code: Sequelize.STRING,
      otp_expire: Sequelize.DATE,
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Users");
  },
};
