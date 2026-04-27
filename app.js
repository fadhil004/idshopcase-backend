const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

//Startup safety checks
const REQUIRED_ENV = [
  "JWT_SECRET",
  "DB_USER",
  "DB_PASS",
  "DOKU_CLIENT_ID",
  "DOKU_SECRET_KEY",
  "EMAIL_USER",
  "EMAIL_PASS",
];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    "[FATAL] Missing required environment variables:",
    missingEnv.join(", "),
  );
  process.exit(1);
}

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const webhookRoutes = require("./routes/webhook");
const imageRoutes = require("./routes/image");
const jntAddressRoutes = require("./routes/jntAddress");
const referenceRoutes = require("./routes/reference");
const { generalLimiter } = require("./middlewares/rateLimiter");

const app = express();

// ── HTTPS redirect (production only) ──────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] === "http") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Security headers via Helmet ────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Agar static /uploads tetap bisa diakses
  }),
);

// Global rate limiter ────────────────────────────────────────────────────
app.use(generalLimiter);

// CORS — FRONTEND_URL
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin && process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
      if (origin && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
  }),
);

//Body parser — batasi ukuran payload
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

//Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/doku", webhookRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/jnt-address", jntAddressRoutes);
app.use("/api/reference", referenceRoutes);

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.get("/", (req, res) => res.json({ message: "IDShopcase API running" }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: isDev ? err.message : "An error occurred, please try again",
    ...(isDev && { stack: err.stack }),
  });
});

module.exports = app;
