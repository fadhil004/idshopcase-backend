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
      {
        brand: "Apple",
        model: "iPhone SE 3rd Gen",
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
      {
        brand: "Samsung",
        model: "Galaxy Z Fold 5",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Samsung",
        model: "Galaxy Z Flip 5",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Samsung",
        model: "Galaxy A54",
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
      {
        brand: "Xiaomi",
        model: "Xiaomi 13",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Xiaomi",
        model: "Redmi K50",
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
      {
        brand: "Oppo",
        model: "Oppo Find X5 Pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Oppo",
        model: "Oppo A78",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Realme
      {
        brand: "Realme",
        model: "Realme GT 2 Pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Realme",
        model: "Realme 10 Pro+",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Vivo
      {
        brand: "Vivo",
        model: "Vivo V23 Pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Vivo",
        model: "Vivo X90 Pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Huawei
      {
        brand: "Huawei",
        model: "Huawei P50 Pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Huawei",
        model: "Huawei Mate 50 Pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Google Pixel
      {
        brand: "Google",
        model: "Pixel 6",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        brand: "Google",
        model: "Pixel 7 Pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("PhoneTypes", null, {});
  },
};
