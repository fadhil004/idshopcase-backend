const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  login,
  logout,
  forgotPassword,
  resetPassword,
  resendOtp,
} = require("../controllers/authController");
const {
  loginLimiter,
  registerLimiter,
  emailLimiter,
} = require("../middlewares/rateLimiter");
const { authenticate } = require("../middlewares/auth");
const { validate, schemas } = require("../middlewares/validate");

router.post("/register", registerLimiter, validate(schemas.register), register);
router.post("/verify-otp", emailLimiter, validate(schemas.verifyOtp), verifyOtp);
router.post("/login", loginLimiter, validate(schemas.login), login);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", emailLimiter, validate(schemas.forgotPassword), forgotPassword);
router.post("/reset-password/:token", emailLimiter, validate(schemas.resetPassword), resetPassword);
router.post("/resend-otp", emailLimiter, validate(schemas.resendOtp), resendOtp);

module.exports = router;
