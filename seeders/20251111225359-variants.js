"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Variants", [
      {
        productId: 1,
        name: "Premium Softcase",
        price: 85000,
        stock: 9999,
        max_images: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 1,
        name: "Diamond Impact",
        price: 135000,
        stock: 9999,
        max_images: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 1,
        name: "Diamond Impact X2 with Magsafe",
        price: 155000,
        stock: 9999,
        max_images: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 1,
        name: "Armor Impact",
        price: 155000,
        stock: 9999,
        max_images: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 1,
        name: "Armor Impact X2 with Magsafe",
        price: 195000,
        stock: 9999,
        max_images: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        productId: 1,
        name: "Bumper Impact X2 with Magsafe",
        price: 275000,
        stock: 9999,
        max_images: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Variants", null, {});
  },
};
