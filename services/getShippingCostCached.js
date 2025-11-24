const redis = require("../config/redis");
const { getShippingCost } = require("./jntService");

module.exports = async function getShippingCostCached(params) {
  const { weight, sendSiteCode, destAreaCode } = params;

  const cacheKey = `ship:${weight}:${sendSiteCode}:${destAreaCode}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("Using cached shipping cost");
    return JSON.parse(cached);
  }

  const result = await getShippingCost(params);

  if (!result.error) {
    await redis.setex(cacheKey, 7200, JSON.stringify(result));
  }

  return result;
};
