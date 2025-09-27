const { Product, CustomImage } = require("../models");
const path = require("path");
const fs = require("fs");

module.exports = {
  getProducts: async (req, res) => {
    try {
      const products = await Product.findAll();
      return res.json(products);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getProductById: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      return res.json(product);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  uploadCustomImage: async (req, res) => {
    try {
      const { productId } = req.body;
      const product = await Product.findByPk(productId);

      if (!product || product.category !== "custom_case") {
        return res
          .status(400)
          .json({ message: "Invalid product for custom image" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      if (req.files.length > 2) {
        return res.status(400).json({ message: "Maximum 2 images allowed" });
      }

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
