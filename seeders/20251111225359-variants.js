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
      {
        name: "7pcs",
        description:
          "Paket dengan 7 pilihan, cocok untuk koleksi yang lebih beragam.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "9pcs",
        description: "Paket dengan 9 pilihan, memberi lebih banyak variasi.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "12pcs",
        description:
          "Paket lengkap dengan 12 pilihan, ideal untuk yang menginginkan lebih.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Variants", null, {});
  },
};
