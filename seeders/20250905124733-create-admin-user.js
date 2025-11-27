"use strict";
const bcrypt = require("bcryptjs");
require("dotenv").config();

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hashSync(process.env.PASS_ADMIN, 10);

    await queryInterface.bulkInsert(
      "Users",
      [
        {
          name: "Admin",
          email: "admin@mail.com",
          password: hashedPassword,
          phone: "08123456789",
          profile_picture: null,
          role: "admin",
          resetPasswordToken: null,
          resetPasswordExpire: null,
          is_verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", { email: "admin@mail.com" }, {});
  },
};
