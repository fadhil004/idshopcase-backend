const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Profile
router.get("/profile", authenticate, userController.getProfile);
router.put("/profile", authenticate, upload.single("profile_picture"), userController.updateProfile);
router.put("/profile/password", authenticate, userController.updatePassword);

// Addresses
router.post("/addresses", authenticate, userController.addAddress);
router.put("/addresses/:id", authenticate, userController.updateAddress);
router.delete("/addresses/:id", authenticate, userController.deleteAddress);

module.exports = router;
