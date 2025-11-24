const {
  Product,
  CustomImage,
  ProductImage,
  Material,
  Variant,
  PhoneType,
} = require("../models");
const path = require("path");
const fs = require("fs");
const redis = require("../config/redis");

module.exports = {
  getProducts: async (req, res) => {
    try {
      const cacheKey = "products:list";

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          message: "Products retrieved (cache)",
          data: JSON.parse(cached),
        });
      }

      const products = await Product.findAll({
        include: [
          { model: ProductImage, attributes: ["id", "imageUrl", "isPrimary"] },
          { model: Material, attributes: ["id", "name"] },
          { model: Variant, attributes: ["id", "name"] },
          { model: PhoneType, attributes: ["id", "brand", "model"] },
        ],
      });

      await redis.setex(cacheKey, 30, JSON.stringify(products));

      return res.json({
        message: "Products retrieved",
        data: products,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getProductById: async (req, res) => {
    try {
      const id = req.params.id;
      const cacheKey = `product:id:${id}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          message: "Product retrieved (cache)",
          data: JSON.parse(cached),
        });
      }

      const product = await Product.findByPk(id, {
        include: [
          { model: ProductImage, attributes: ["id", "imageUrl", "isPrimary"] },
          { model: Material, attributes: ["id", "name"] },
          { model: Variant, attributes: ["id", "name"] },
          { model: PhoneType, attributes: ["id", "brand", "model"] },
        ],
      });

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      await redis.setex(cacheKey, 30, JSON.stringify(product));

      return res.json({
        message: "Product retrieved",
        data: product,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  uploadCustomImage: async (req, res) => {
    try {
      const { productId } = req.body;
      const product = await Product.findByPk(productId);

      // if (!product || product.category !== "custom_case") {
      //   return res
      //     .status(400)
      //     .json({ message: "Invalid product for custom image" });
      // }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // if (req.files.length > 2) {
      //   return res.status(400).json({ message: "Maximum 2 images allowed" });
      // }

      const uploadedImages = [];
      for (const file of req.files) {
        const originalPath = `/uploads/customs/${file.filename}`;

        const image = await CustomImage.create({
          userId: req.user.id,
          productId: product.id,
          image_url: originalPath,
          processed_url: null,
        });

        uploadedImages.push(image);
      }

      return res.json({
        message: "Custom images uploaded. Processed URL will be updated later.",
        images: uploadedImages,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
