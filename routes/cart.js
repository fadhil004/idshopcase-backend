const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middlewares/auth");

router.get("/", authenticate, cartController.getCart);
router.post("/", authenticate, cartController.addToCart);
router.put("/:id", authenticate, cartController.updateCartItem);
router.delete("/:id", authenticate, cartController.removeCartItem);

module.exports = router;
