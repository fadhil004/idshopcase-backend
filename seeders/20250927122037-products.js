"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Products", [
      {
        name: "Custom Case",
        description: "Custom clear case dengan foto wajah pilihanmu.",
        category: "custom_case",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Keychain",
        description: "Keychain unik dengan desain stylish.",
        category: "keychain",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Phone Charm",
        description: "Phone charm cantik untuk hiasan HP.",
        category: "phone_charm",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Pop Socket",
        description: "Popsocket nyaman untuk genggaman HP.",
        category: "pop_socket",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Products", null, {});
  },
};
