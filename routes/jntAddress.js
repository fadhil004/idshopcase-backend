const express = require("express");
const router = express.Router();
const jntAddressController = require("../controllers/jntAddressController");

router.get("/provinces", jntAddressController.getProvinces);
router.get("/cities", jntAddressController.getCities);
router.get("/districts", jntAddressController.getDistricts);
router.get("/mapping", jntAddressController.getMappingDetails);

module.exports = router;
