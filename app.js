const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);

module.exports = app;
