// "use strict";

// module.exports = {
//   up: async (queryInterface, Sequelize) => {
//     await queryInterface.createTable("Payments", {
//       id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

//       orderId: {
//         type: Sequelize.INTEGER,
//         references: { model: "Orders", key: "id" },
//         onDelete: "CASCADE",
//       },

//       payment_gateway: Sequelize.STRING, // "DOKU"
//       transaction_id: Sequelize.STRING, // invoice_number / trx id dari DOKU
//       request_id: Sequelize.STRING, // requestId kamu
//       payment_url: Sequelize.TEXT,

//       status: {
//         type: Sequelize.ENUM("pending", "success", "failed", "expired"),
//         defaultValue: "pending",
//       },

//       amount: Sequelize.DECIMAL,
//       expired_at: Sequelize.DATE,

//       createdAt: Sequelize.DATE,
//       updatedAt: Sequelize.DATE,
//     });
//   },

//   /*************  ✨ Windsurf Command ⭐  *************/
//   /**
//    * Drops the Payments table
//    * @param {QueryInterface} queryInterface
//    */
//   /*******  eb1f187c-fef6-4c45-8a51-30a44ce722e1  *******/
// };

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Payments", "payment_url", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "transaction_id",
    });

    await queryInterface.addColumn("Payments", "request_id", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "payment_url",
    });

    await queryInterface.addColumn("Payments", "expired_at", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "amount",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("Payments", "payment_url");
    await queryInterface.removeColumn("Payments", "request_id");
    await queryInterface.removeColumn("Payments", "expired_at");
  },
};
