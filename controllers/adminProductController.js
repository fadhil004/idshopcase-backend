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
  downloadCustomImage: async (req, res) => {
    try {
      const { id } = req.params;
      const cached = await redis.get(`customImage:${id}`);

      let customImage;
      if (cached) {
        customImage = JSON.parse(cached);
      } else {
        customImage = await CustomImage.findByPk(id);
        if (!customImage) {
          return res.status(404).json({ message: "Custom image not found" });
        }
        await redis.setex(
          `customImage:${id}`,
          600,
          JSON.stringify(customImage)
        );
      }

      const filePath = path.join(__dirname, "..", customImage.image_url);

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
        materials,
        variants,
        phoneTypes,
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
      });

      if (phoneTypes) await product.setPhoneTypes(phoneTypes);
      if (materials) await product.setMaterials(materials);
      if (variants) await product.setVariants(variants);

      if (req.files && req.files.length > 0) {
        const productImages = req.files.map((file, index) => ({
          productId: product.id,
          imageUrl: `/uploads/products/${file.filename}`,
          isPrimary: index === 0,
        }));

        await ProductImage.bulkCreate(productImages);
      }

      const newProduct = await Product.findByPk(product.id, {
        include: [ProductImage, Material, Variant, PhoneType],
      });

      await redis.del("products:all");

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
        materials,
        variants,
        phoneTypes,
      } = req.body;

      const product = await Product.findByPk(id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      await product.update({
        name,
        description,
        price,
        stock,
        category,
      });

      if (phoneTypes) await product.setPhoneTypes(phoneTypes);
      if (materials) await product.setMaterials(materials);
      if (variants) await product.setVariants(variants);

      if (req.files && req.files.length > 0) {
        const productImages = req.files.map((file, index) => ({
          productId: product.id,
          imageUrl: `/uploads/products/${file.filename}`,
          isPrimary: index === 0,
        }));

        await ProductImage.bulkCreate(productImages);
      }

      const updatedProduct = await Product.findByPk(product.id, {
        include: [ProductImage, Material, Variant, PhoneType],
      });

      await redis.del("products:all");
      await redis.del(`product:${id}`);

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

      const filePath = path.join(__dirname, "..", image.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await image.destroy();

      await redis.del("products:all");
      await redis.del(`product:${image.productId}`);

      res.json({ message: "Image deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id, {
        include: [ProductImage],
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

      await product.setPhoneTypes([]);
      await product.setMaterials([]);
      await product.setVariants([]);

      await product.destroy();

      await redis.del("products:all");
      await redis.del(`product:${id}`);

      return res.json({ message: "Product deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },
};
