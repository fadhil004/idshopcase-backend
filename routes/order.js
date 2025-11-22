const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderSummary,
  getOrderById,
  getOrders,
  trackOrder,
  getAllOrdersByAdmin,
  getOrderByIdAdmin,
} = require("../controllers/orderController");
const { uploadProduct } = require("../middlewares/upload");
const { authenticate, authorizeAdmin } = require("../middlewares/auth");

router.get("/admin/orders", authenticate, authorizeAdmin, getAllOrdersByAdmin);
router.get(
  "/admin/orders/:id",
  authenticate,
  authorizeAdmin,
  getOrderByIdAdmin
);

router.post(
  "/",
  authenticate,
  uploadProduct.array("custom_images", 12),
  createOrder
);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderById);
router.post("/summary", authenticate, getOrderSummary);
router.get("/:orderId/tracking", authenticate, trackOrder);

module.exports = router;
