"use strict";
const fs = require("fs");
const csv = require("csv-parser");

module.exports = {
  async up(queryInterface, Sequelize) {
    const addressMappings = [];

    const processCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream("seeders/TEMPLATE MAPPING L3 - J&T.csv")
          .pipe(csv())
          .on("data", (row) => {
            addressMappings.push({
              province: row.province,
              city: row.city,
              district: row.district,
              jnt_province: row.jnt_province,
              jnt_city: row.jnt_city,
              jnt_city_code: row.jnt_city_code,
              jnt_district: row.jnt_district,
              jnt_area_code: row.jnt_area_code,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          })
          .on("end", () => {
            console.log("CSV file successfully processed.");
            resolve();
          })
          .on("error", (error) => {
            reject(error);
          });
      });
    };

    try {
      await processCSV();

      await queryInterface.bulkInsert(
        "JntAddressMappings",
        addressMappings,
        {}
      );
      console.log("Data berhasil dimasukkan ke database!");
    } catch (error) {
      console.error("Gagal memasukkan data:", error);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("JntAddressMappings", null, {});
  },
};
