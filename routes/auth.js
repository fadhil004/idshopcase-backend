const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  resendOtp,
} = require("../controllers/authController");
const {
  loginLimiter,
  registerLimiter,
  emailLimiter,
} = require("../middlewares/rateLimiter");

router.post("/register", registerLimiter, register);
router.post("/verify-otp", emailLimiter, verifyOtp);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", emailLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/resend-otp", emailLimiter, resendOtp);

module.exports = router;
