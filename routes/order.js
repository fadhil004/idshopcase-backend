const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate } = require("../middlewares/auth");

router.post("/checkout", authenticate, orderController.checkout);
router.post("/payment-callback", orderController.paymentCallback);
router.get("/track/:awb", authenticate, orderController.trackOrder);
router.post("/cancel/:orderId", authenticate, orderController.cancelOrder);

module.exports = router;
