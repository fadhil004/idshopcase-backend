const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const webhookRoutes = require("./routes/webhook");
const imageRoutes = require("./routes/image");
const jntAddressRoutes = require("./routes/jntAddress");
const referenceRoutes = require("./routes/reference");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/doku", webhookRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/jnt-address", jntAddressRoutes);
app.use("/api/reference", referenceRoutes);

module.exports = app;
