const { Product, CustomImage } = require("../models");
const path = require("path");
const fs = require("fs");

module.exports = {
  downloadCustomImage: async (req, res) => {
    try {
      const { id } = req.params;
      const customImage = await CustomImage.findByPk(id);

      if (!customImage) {
        return res.status(404).json({ message: "Custom image not found" });
      }

      const filePath = path.join(__dirname, "..", customImage.image_url);

      console.log("Image path from DB:", customImage.image_url);
      console.log("Resolved file path:", filePath);
      console.log("File exists:", fs.existsSync(filePath));

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      return res.download(filePath, path.basename(filePath));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price,
        stock,
        category,
        material,
        variation,
        phone_type,
      } = req.body;

      const product = await Product.findByPk(id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.stock = stock || product.stock;
      product.category = category || product.category;
      product.material = material || product.material;
      product.variation = variation || product.variation;
      product.phone_type = phone_type || product.phone_type;

      await product.save();

      return res.json({
        message: "Product updated",
        product,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },
};
