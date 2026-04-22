const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middlewares/auth");
const { validate, schemas } = require("../middlewares/validate");

router.get("/", authenticate, cartController.getCart);
router.post("/", authenticate, validate(schemas.addToCart), cartController.addToCart);
router.put("/:id", authenticate, validate(schemas.updateCartItem), cartController.updateCartItem);
router.delete("/:id", authenticate, cartController.removeCartItem);

module.exports = router;
