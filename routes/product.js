const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth");
const productController = require("../controllers/productController");

const { uploadProduct } = require("../middlewares/upload");

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/custom/upload",
  authenticate,
  uploadProduct.array("images", 2),
  productController.uploadCustomImage
);

module.exports = router;
