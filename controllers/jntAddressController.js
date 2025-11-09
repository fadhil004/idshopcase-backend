const { JntAddressMapping } = require("../models");

module.exports = {
  getProvinces: async (req, res) => {
    try {
      const provinces = await JntAddressMapping.findAll({
        attributes: ["province"],
        group: ["province"],
        order: [["province", "ASC"]],
      });

      return res.json({
        message: "Provinces fetched successfully",
        data: provinces.map((p) => p.province),
      });
    } catch (err) {
      console.error("Error fetching provinces:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  getCities: async (req, res) => {
    try {
      const { province } = req.query;
      if (!province) {
        return res.status(400).json({ message: "Province is required" });
      }

      const cities = await JntAddressMapping.findAll({
        where: { province },
        attributes: ["city"],
        group: ["city"],
        order: [["city", "ASC"]],
      });

      return res.json({
        message: "Cities fetched successfully",
        data: cities.map((c) => c.city),
      });
    } catch (err) {
      console.error("Error fetching cities:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  getDistricts: async (req, res) => {
    try {
      const { city } = req.query;
      if (!city) {
        return res.status(400).json({ message: "City is required" });
      }

      const districts = await JntAddressMapping.findAll({
        where: { city },
        attributes: ["district"],
        group: ["district"],
        order: [["district", "ASC"]],
      });

      return res.json({
        message: "Districts fetched successfully",
        data: districts.map((d) => d.district),
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

      const mapping = await JntAddressMapping.findOne({
        where: { province, city, district },
      });

      if (!mapping)
        return res
          .status(404)
          .json({ message: "Mapping not found for given address" });

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
