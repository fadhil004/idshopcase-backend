const { JntAddressMapping } = require("../models");
const redis = require("../config/redis");

module.exports = {
  getProvinces: async (req, res) => {
    try {
      const cacheKey = "jnt:provinces";
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json({
          message: "Provinces fetched (cache)",
          data: JSON.parse(cached),
        });
      }

      const provinces = await JntAddressMapping.findAll({
        attributes: ["province"],
        group: ["province"],
        order: [["province", "ASC"]],
      });

      const list = provinces.map((p) => p.province);

      await redis.setex(cacheKey, 3600, JSON.stringify(list));

      return res.json({
        message: "Provinces fetched successfully",
        data: list,
      });
    } catch (err) {
      console.error("Error fetching provinces:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  getCities: async (req, res) => {
    try {
      const { province } = req.query;
      if (!province)
        return res.status(400).json({ message: "Province is required" });

      const cacheKey = `jnt:cities:${province}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json({
          message: "Cities fetched (cache)",
          data: JSON.parse(cached),
        });
      }

      const cities = await JntAddressMapping.findAll({
        where: { province },
        attributes: ["city"],
        group: ["city"],
        order: [["city", "ASC"]],
      });

      const list = cities.map((c) => c.city);

      await redis.setex(cacheKey, 3600, JSON.stringify(list));

      return res.json({
        message: "Cities fetched successfully",
        data: list,
      });
    } catch (err) {
      console.error("Error fetching cities:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  getDistricts: async (req, res) => {
    try {
      const { city } = req.query;
      if (!city) return res.status(400).json({ message: "City is required" });

      const cacheKey = `jnt:districts:${city}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json({
          message: "Districts fetched (cache)",
          data: JSON.parse(cached),
        });
      }

      const districts = await JntAddressMapping.findAll({
        where: { city },
        attributes: ["district"],
        group: ["district"],
        order: [["district", "ASC"]],
      });

      const list = districts.map((d) => d.district);

      await redis.setex(cacheKey, 3600, JSON.stringify(list));

      return res.json({
        message: "Districts fetched successfully",
        data: list,
      });
    } catch (err) {
      console.error("Error fetching districts:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  getMappingDetails: async (req, res) => {
    try {
      const { province, city, district } = req.query;

      if (!province || !city || !district) {
        return res.status(400).json({
          message: "Province, city, and district are required",
        });
      }

      const cacheKey = `jnt:mapping:${province}:${city}:${district}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json({
          message: "Mapping detail fetched (cache)",
          data: JSON.parse(cached),
        });
      }

      const mapping = await JntAddressMapping.findOne({
        where: { province, city, district },
      });

      if (!mapping) {
        return res.status(404).json({
          message: "Mapping not found for given address",
        });
      }

      await redis.setex(cacheKey, 3600, JSON.stringify(mapping));

      return res.json({
        message: "Mapping detail fetched successfully",
        data: mapping,
      });
    } catch (err) {
      console.error("Error fetching mapping detail:", err);
      return res.status(500).json({ error: err.message });
    }
  },
};
