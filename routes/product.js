const express = require("express");
const router = express.Router();
const { authenticate, authorizeAdmin } = require("../middlewares/auth");
const productController = require("../controllers/productController");
const adminProductController = require("../controllers/adminProductController");
const { uploadProduct, uploadCustoms, validateUploadedFiles } = require("../middlewares/upload");

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

// authenticate before upload middleware to prevent unauthenticated file writes
router.post(
  "/custom/upload",
  authenticate,
  uploadCustoms.array("images", 12),
  validateUploadedFiles,
  productController.uploadCustomImage,
);

// Admin manage — auth + authz always run BEFORE multer
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  uploadProduct.array("images", 5),
  validateUploadedFiles,
  adminProductController.createProduct,
);
router.get(
  "/custom/:id/download",
  authenticate,
  authorizeAdmin,
  adminProductController.downloadCustomImage,
);
router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  uploadProduct.array("images", 5),
  validateUploadedFiles,
  adminProductController.updateProduct,
);
router.delete(
  "/images/:id",
  authenticate,
  authorizeAdmin,
  adminProductController.deleteProductImage,
);
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  adminProductController.deleteProduct,
);

module.exports = router;
