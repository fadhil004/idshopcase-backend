const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderSummary,
  getOrderById,
  getOrders,
} = require("../controllers/orderController");
const { authenticate } = require("../middlewares/auth");

router.post("/", authenticate, createOrder);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderById);
router.post("/summary", authenticate, getOrderSummary);

module.exports = router;
