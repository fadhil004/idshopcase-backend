const { sequelize } = require("./models");

async function main() {
  await sequelize.sync({ force: true, logging: console.log });
}

main().catch((err) => console.log(err));
