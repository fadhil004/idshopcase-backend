"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Variants", [
      {
        name: "Satu Sisi",
        description: "Warna klasik yang elegan dan netral.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dua Sisi",
        description: "Memberikan kesan bersih dan minimalis.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Variants", null, {});
  },
};
