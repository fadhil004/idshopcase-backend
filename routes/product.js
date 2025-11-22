const express = require("express");
const router = express.Router();
const { authenticate, authorizeAdmin } = require("../middlewares/auth");
const productController = require("../controllers/productController");
const adminProductController = require("../controllers/adminProductController");
const { uploadProduct } = require("../middlewares/upload");

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/custom/upload",
  authenticate,
  uploadProduct.array("images", 12),
  productController.uploadCustomImage
);

// Admin manage
router.post(
  "/",
  uploadProduct.array("images", 5),
  authenticate,
  authorizeAdmin,
  adminProductController.createProduct
);
router.get(
  "/custom/:id/download",
  authenticate,
  authorizeAdmin,
  adminProductController.downloadCustomImage
);
router.put(
  "/:id",
  uploadProduct.array("images", 5),
  authenticate,
  authorizeAdmin,
  adminProductController.updateProduct
);
router.delete(
  "/images/:id",
  authenticate,
  authorizeAdmin,
  adminProductController.deleteProductImage
);
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  adminProductController.deleteProduct
);

module.exports = router;
