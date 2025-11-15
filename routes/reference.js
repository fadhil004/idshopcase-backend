const express = require("express");
const router = express.Router();
const { authenticate, authorizeAdmin } = require("../middlewares/auth");
const controller = require("../controllers/referenceController");

// Phone Types
router.get("/phone-types", controller.getPhoneTypes);
router.post(
  "/phone-types",
  authenticate,
  authorizeAdmin,
  controller.createPhoneType
);
router.put(
  "/phone-types/:id",
  authenticate,
  authorizeAdmin,
  controller.updatePhoneType
);
router.delete(
  "/phone-types/:id",
  authenticate,
  authorizeAdmin,
  controller.deletePhoneType
);

// Materials
router.get("/materials", controller.getMaterials);
router.post(
  "/materials",
  authenticate,
  authorizeAdmin,
  controller.createMaterial
);
router.put(
  "/materials/:id",
  authenticate,
  authorizeAdmin,
  controller.updateMaterial
);
router.delete(
  "/materials/:id",
  authenticate,
  authorizeAdmin,
  controller.deleteMaterial
);

// Variants
router.get("/variants", controller.getVariants);
router.post(
  "/variants",
  authenticate,
  authorizeAdmin,
  controller.createVariant
);
router.put(
  "/variants/:id",
  authenticate,
  authorizeAdmin,
  controller.updateVariant
);
router.delete(
  "/variants/:id",
  authenticate,
  authorizeAdmin,
  controller.deleteVariant
);

module.exports = router;
