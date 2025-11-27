const { PhoneType, Variant } = require("../models");
const redis = require("../config/redis");

module.exports = {
  getPhoneTypes: async (req, res) => {
    try {
      const cacheKey = "phoneTypes:list";

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          message: "Phone types retrieved (cache)",
          data: JSON.parse(cached),
        });
      }

      const types = await PhoneType.findAll({ order: [["brand", "ASC"]] });

      await redis.setex(cacheKey, 300, JSON.stringify(types)); // 5 menit

      res.json({ message: "Phone types retrieved", data: types });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  createPhoneType: async (req, res) => {
    try {
      const { brand, model } = req.body;
      const type = await PhoneType.create({ brand, model });

      await redis.del("phoneTypes:list");

      res.status(201).json({ message: "Phone type created", data: type });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updatePhoneType: async (req, res) => {
    try {
      const { id } = req.params;
      const { brand, model } = req.body;
      const type = await PhoneType.findByPk(id);
      if (!type)
        return res.status(404).json({ message: "Phone type not found" });
      type.brand = brand || type.brand;
      type.model = model || type.model;
      await type.save();

      await redis.del("phoneTypes:list");

      res.json({ message: "Phone type updated", data: type });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deletePhoneType: async (req, res) => {
    try {
      const { id } = req.params;
      const type = await PhoneType.findByPk(id);
      if (!type)
        return res.status(404).json({ message: "Phone type not found" });

      await type.destroy();

      await redis.del("phoneTypes:list");

      res.json({ message: "Phone type deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getVariants: async (req, res) => {
    try {
      const cacheKey = "variants:list";

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          message: "Variants retrieved (cache)",
          data: JSON.parse(cached),
        });
      }

      const variants = await Variant.findAll({ order: [["name", "ASC"]] });

      await redis.setex(cacheKey, 300, JSON.stringify(variants));

      res.json({ message: "Variants retrieved", data: variants });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  createVariant: async (req, res) => {
    try {
      const { name, price, stock, max_images } = req.body;
      const variant = await Variant.create({ name, price, stock, max_images });

      await redis.del("variants:list");

      res.status(201).json({ message: "Variant created", data: variant });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  updateVariant: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, stock, max_images } = req.body;
      const variant = await Variant.findByPk(id);
      if (!variant)
        return res.status(404).json({ message: "Variant not found" });
      variant.name = name ?? variant.name;
      variant.price = price ?? variant.price;
      variant.stock = stock ?? variant.stock;
      variant.max_images = max_images ?? variant.max_images;
      await variant.save();

      await redis.del("variants:list");

      res.json({ message: "Variant updated", data: variant });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteVariant: async (req, res) => {
    try {
      const { id } = req.params;
      const variant = await Variant.findByPk(id);
      if (!variant)
        return res.status(404).json({ message: "Variant not found" });

      await variant.destroy();
      await redis.del("variants:list");

      res.json({ message: "Variant deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
