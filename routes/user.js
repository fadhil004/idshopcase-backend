const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorizeAdmin } = require("../middlewares/auth");
const { uploadProfile } = require("../middlewares/upload");
const { validate, schemas } = require("../middlewares/validate");

// Profile
router.get("/profile", authenticate, userController.getProfile);
router.put(
  "/profile",
  authenticate,
  uploadProfile.single("profile_picture"),
  validate(schemas.updateProfile),
  userController.updateProfile
);
router.put("/profile/password", authenticate, validate(schemas.updatePassword), userController.updatePassword);

// Addresses
router.get("/addresses", authenticate, userController.getAddresses);
router.post("/addresses", authenticate, validate(schemas.addAddress), userController.addAddress);
router.get("/addresses/:id", authenticate, userController.getAddressById);
router.put("/addresses/:id", authenticate, validate(schemas.addAddress), userController.updateAddress);
router.delete("/addresses/:id", authenticate, userController.deleteAddress);

// Admin Panel
router.post(
  "/create",
  authenticate,
  authorizeAdmin,
  validate(schemas.createUserByAdmin),
  userController.createUserByAdmin
);
router.get("/", authenticate, authorizeAdmin, userController.getAllUsers);
router.get("/:id", authenticate, authorizeAdmin, userController.getUserById);
router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  validate(schemas.updateUserByAdmin),
  userController.updateUserByAdmin
);
router.delete("/:id", authenticate, authorizeAdmin, userController.deleteUser);

module.exports = router;
