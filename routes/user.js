const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorizeAdmin } = require("../middlewares/auth");
const { uploadProfile } = require("../middlewares/upload");

// Profile
router.get("/profile", authenticate, userController.getProfile);
router.put(
  "/profile",
  authenticate,
  uploadProfile.single("profile_picture"),
  userController.updateProfile
);
router.put("/profile/password", authenticate, userController.updatePassword);

// Addresses
router.post("/addresses", authenticate, userController.addAddress);
router.put("/addresses/:id", authenticate, userController.updateAddress);
router.delete("/addresses/:id", authenticate, userController.deleteAddress);

// Admin Panel
router.get("/", authenticate, authorizeAdmin, userController.getAllUsers);
router.get("/:id", authenticate, authorizeAdmin, userController.getUserById);
router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  userController.updateUserByAdmin
);
router.delete("/:id", authenticate, authorizeAdmin, userController.deleteUser);

module.exports = router;