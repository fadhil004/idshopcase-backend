const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { client: redisClient } = require("../config/redis");

function makeStore(prefix) {
  return new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: `rl:${prefix}:`,
  });
}

// Login — 10 percobaan per 15 menit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("login"),
  message: {
    message: "Terlalu banyak percobaan login, coba lagi dalam 15 menit",
  },
});

// Register — 5 per jam
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("register"),
  message: { message: "Terlalu banyak pendaftaran, coba lagi dalam 1 jam" },
});

// Forgot-password, resend-OTP, reset-password — 5 per 15 menit
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("email"),
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
  store: makeStore("general"),
  message: { message: "Terlalu banyak request, coba lagi nanti" },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  emailLimiter,
  generalLimiter,
};
