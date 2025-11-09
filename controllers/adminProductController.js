const { Product, CustomImage, ProductImage } = require("../models");
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

  createProduct: async (req, res) => {
    try {
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

      if (!name || !price || !stock || !category) {
        return res.status(400).json({
          message: "Name, price, stock, and category are required fields",
        });
      }

      const product = await Product.create({
        name,
        description,
        price,
        stock,
        category,
        material,
        variation,
        phone_type,
      });

      if (req.files && req.files.length > 0) {
        const productImages = req.files.map((file, index) => ({
          productId: product.id,
          imageUrl: `/uploads/products/${file.filename}`,
          isPrimary: index === 0,
        }));

        await ProductImage.bulkCreate(productImages);
      }

      const newProduct = await Product.findByPk(product.id, {
        include: [{ model: ProductImage }],
      });

      return res.status(201).json({
        message: "Product created successfully",
        product: newProduct,
      });
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

      if (req.files && req.files.length > 0) {
        const productImages = req.files.map((file, index) => ({
          productId: product.id,
          imageUrl: `/uploads/products/${file.filename}`,
          isPrimary: index === 0, // Gambar pertama dijadikan utama
        }));

        await ProductImage.bulkCreate(productImages);
      }

      const updatedProduct = await Product.findByPk(product.id, {
        include: [{ model: ProductImage }],
      });

      return res.json({
        message: "Product updated",
        product: updatedProduct,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  deleteProductImage: async (req, res) => {
    try {
      const { imageId } = req.params;
      const image = await ProductImage.findByPk(imageId);
      if (!image) return res.status(404).json({ message: "Image not found" });

      // Hapus file fisik
      const filePath = path.join(__dirname, "..", image.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await image.destroy();

      res.json({ message: "Image deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id, {
        include: [{ model: ProductImage }],
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.ProductImages && product.ProductImages.length > 0) {
        for (const img of product.ProductImages) {
          const filePath = path.join(__dirname, "..", img.imageUrl);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          await img.destroy();
        }
      }

      await product.destroy();

      return res.json({ message: "Product deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },
};
