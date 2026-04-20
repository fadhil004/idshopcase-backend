const rateLimit = require("express-rate-limit");

// Untuk endpoint login — 10 percobaan per 15 menit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak percobaan login, coba lagi dalam 15 menit",
  },
});

// Untuk register — 5 per jam
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Terlalu banyak pendaftaran, coba lagi dalam 1 jam" },
});

// Untuk forgot-password & resend-OTP — 5 per 15 menit
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak permintaan email, coba lagi dalam 15 menit",
  },
});

// Umum — 100 req per 15 menit per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Terlalu banyak request, coba lagi nanti" },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  emailLimiter,
  generalLimiter,
};
