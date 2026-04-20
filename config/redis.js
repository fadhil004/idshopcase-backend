const redis = require("redis");

let isConnected = false;

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= 5) {
        console.error(
          "[Redis] Gagal reconnect setelah 5 percobaan — cache dinonaktifkan",
        );
        return false; // stop retrying
      }
      return Math.min(retries * 200, 2000);
    },
  },
});

client.on("connect", () => {
  isConnected = true;
  console.log("[Redis] Terhubung");
});

client.on("ready", () => {
  isConnected = true;
});

client.on("error", (err) => {
  isConnected = false;
  console.error("[Redis] Error:", err.message);
});

client.on("end", () => {
  isConnected = false;
  console.warn("[Redis] Koneksi terputus");
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error("[Redis] Gagal connect awal:", err.message);
    isConnected = false;
  }
})();

// Helper: get — return null jika Redis tidak tersedia (tidak throw)
async function get(key) {
  if (!isConnected) return null;
  try {
    return await client.get(key);
  } catch (err) {
    console.error("[Redis] get error:", err.message);
    return null;
  }
}

// Helper: setex — skip jika Redis tidak tersedia
async function setex(key, ttl, value) {
  if (!isConnected) return null;
  try {
    return await client.set(key, value, { EX: ttl });
  } catch (err) {
    console.error("[Redis] setex error:", err.message);
    return null;
  }
}

// Helper: del — skip jika Redis tidak tersedia
async function del(key) {
  if (!isConnected) return null;
  try {
    return await client.del(key);
  } catch (err) {
    console.error("[Redis] del error:", err.message);
    return null;
  }
}

module.exports = { client, get, setex, del };
