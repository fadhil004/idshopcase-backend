const express = require("express");
const router = express.Router();
const { handleDokuCallback } = require("../controllers/webhookController");

router.post("/callback", handleDokuCallback);

module.exports = router;
