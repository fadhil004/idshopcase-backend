const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log("DB Error: ", err));
