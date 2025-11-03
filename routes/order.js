const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderSummary,
} = require("../controllers/orderController");
const { authenticate } = require("../middlewares/auth");

router.post("/", authenticate, createOrder);
router.post("/summary", authenticate, getOrderSummary);

module.exports = router;
