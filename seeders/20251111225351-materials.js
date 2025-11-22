"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Materials", [
      {
        name: "Premium Softcase",
        description:
          "Lembut dan lentur, memberikan perlindungan ringan dan fleksibel.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Diamond Impact",
        description:
          "Material keras dan kuat untuk perlindungan maksimal dari benturan.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Armor Impact",
        description:
          "Perlindungan ekstra dengan material tahan banting dan anti-scratch.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Magsafe Diamond Impact",
        description:
          "Tipe premium dengan kompatibilitas Magsafe dan ketahanan ganda.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Magsafe Bumper Impact X2",
        description:
          "Perlindungan maksimal dengan bumper yang kompatibel dengan Magsafe dan daya tahan ganda.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Materials", null, {});
  },
};
