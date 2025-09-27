"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Products", [
      {
        name: "Custom Case",
        description: "Custom clear case dengan foto wajah pilihanmu",
        price: 150000,
        stock: 9999,
        category: "custom_case",
        material: null, // material dipilih user saat order
        phone_type: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Keychain",
        description: "Keychain unik dengan desain stylish",
        price: 50000,
        stock: 100,
        category: "keychain",
        material: null,
        phone_type: null,
        image: "/uploads/products/keychain.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Phonecharm",
        description: "Phonecharm cantik untuk hiasan HP",
        price: 40000,
        stock: 100,
        category: "phone_charm",
        material: null,
        phone_type: null,
        image: "/uploads/products/phonecharm.jpeg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Popsocket",
        description: "Popsocket nyaman untuk genggaman HP",
        price: 60000,
        stock: 100,
        category: "pop_socket",
        material: null,
        phone_type: null,
        image: "/uploads/products/popsocket.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Products", null, {});
  },
};
