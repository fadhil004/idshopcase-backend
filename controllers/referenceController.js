const { PhoneType, Material, Variant } = require("../models");
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
  getMaterials: async (req, res) => {
    try {
      const cacheKey = "materials:list";

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          message: "Materials retrieved (cache)",
          data: JSON.parse(cached),
        });
      }

      const materials = await Material.findAll({ order: [["name", "ASC"]] });

      await redis.setex(cacheKey, 300, JSON.stringify(materials));

      res.json({ message: "Materials retrieved", data: materials });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  createMaterial: async (req, res) => {
    try {
      const { name, description } = req.body;
      const material = await Material.create({ name, description });

      await redis.del("materials:list");

      res.status(201).json({ message: "Material created", data: material });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  updateMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const material = await Material.findByPk(id);
      if (!material)
        return res.status(404).json({ message: "Material not found" });

      material.name = name || material.name;
      material.description = description || material.description;
      await material.save();

      await redis.del("materials:list");

      res.json({ message: "Material updated", data: material });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  deleteMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      const material = await Material.findByPk(id);
      if (!material)
        return res.status(404).json({ message: "Material not found" });

      await material.destroy();
      await redis.del("materials:list");

      res.json({ message: "Material deleted" });
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
      const { name, description } = req.body;
      const variant = await Variant.create({ name, description });

      await redis.del("variants:list");

      res.status(201).json({ message: "Variant created", data: variant });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  updateVariant: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const variant = await Variant.findByPk(id);
      if (!variant)
        return res.status(404).json({ message: "Variant not found" });
      variant.name = name || variant.name;
      variant.description = description || variant.description;
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
