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
  uploadProduct.array("images", 2),
  productController.uploadCustomImage
);

// Admin manage
router.get(
  "/custom/:id/download",
  authenticate,
  authorizeAdmin,
  adminProductController.downloadCustomImage
);
router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  adminProductController.updateProduct
);

module.exports = router;
