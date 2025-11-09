const express = require("express");
const {
  getImageProduct,
  getImageCustom,
  getImageProfilePicture,
} = require("../controllers/imageController");
const router = express.Router();

router.get("/products/:imageName", getImageProduct);
router.get("/customs/:imageName", getImageCustom);
router.get("/profile_pictures/:imageName", getImageProfilePicture);

module.exports = router;
