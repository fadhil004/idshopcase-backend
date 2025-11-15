"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("PhoneTypes", [
      // iPhone
      {
        brand: "Apple",
        model: "iPhone 12",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Apple",
        model: "iPhone 13",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Apple",
        model: "iPhone 14",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Apple",
        model: "iPhone 15",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Apple",
        model: "iPhone 16",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Apple",
        model: "iPhone 17",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Samsung
      {
        brand: "Samsung",
        model: "Galaxy S22",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Samsung",
        model: "Galaxy A55",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Samsung",
        model: "Galaxy S23",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Samsung",
        model: "Galaxy S55",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Xiaomi
      {
        brand: "Xiaomi",
        model: "Redmi Note 13",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Xiaomi",
        model: "POCO X5",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Oppo
      {
        brand: "Oppo",
        model: "Reno 11",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Oppo",
        model: "A98",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("PhoneTypes", null, {});
  },
};
