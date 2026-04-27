const jwt = require("jsonwebtoken");
const redis = require("../config/redis");

async function isTokenBlacklisted(jti) {
  if (!jti) return false;
  try {
    const val = await redis.get(`jwt:blacklist:${jti}`);
    return val !== null;
  } catch {
    // Jika Redis error, fail-open (jangan block semua user)
    return false;
  }
}

async function blacklistToken(decoded) {
  if (!decoded?.jti || !decoded?.exp) return;
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.setex(`jwt:blacklist:${decoded.jti}`, ttl, "1");
  }
}

const authenticate = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    // Cek blacklist
    if (await isTokenBlacklisted(decoded.jti)) {
      return res
        .status(401)
        .json({ message: "Token sudah tidak berlaku, silakan login kembali" });
    }

    req.user = decoded;
    next();
  });
};

const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin, blacklistToken };
