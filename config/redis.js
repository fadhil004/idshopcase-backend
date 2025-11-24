const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

client.on("error", (err) => {
  console.error("Redis Error:", err);
});

(async () => {
  await client.connect();
  console.log("Redis connected");
})();

module.exports = {
  client,

  // Compatible helpers (pengganti setex)
  async setex(key, ttl, value) {
    return client.set(key, value, { EX: ttl });
  },

  async get(key) {
    return client.get(key);
  },

  async del(key) {
    return client.del(key);
  },
};
