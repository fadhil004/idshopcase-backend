const {
  Product,
  CustomImage,
  ProductImage,
  Variant,
  PhoneType,
  Sequelize,
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
      const { name, description, category, variants, phoneTypes } = req.body;

      const product = await Product.create({ name, description, category });

      if (phoneTypes) {
        const parsedPhoneTypes = JSON.parse(phoneTypes);
        await product.setPhoneTypes(parsedPhoneTypes);
      }

      if (req.files && req.files.length > 0) {
        const productImages = req.files.map((file, index) => ({
          productId: product.id,
          imageUrl: `/uploads/products/${file.filename}`,
          isPrimary: index === 0,
        }));

        await ProductImage.bulkCreate(productImages);
      }

      if (variants) {
        const parsedVariants = JSON.parse(variants);
        await product.setVariants(parsedVariants);
      }

      const newProduct = await Product.findByPk(product.id, {
        include: [ProductImage, Variant, PhoneType],
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
      const { name, description, category, variants, phoneTypes } = req.body;

      const product = await Product.findByPk(id, {
        include: [Variant, ProductImage, PhoneType],
      });

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      await product.update({
        name,
        description,
        category,
      });

      if (phoneTypes) {
        const parsedPhoneTypes = JSON.parse(phoneTypes);
        await product.setPhoneTypes(parsedPhoneTypes);
      }

      if (req.files && req.files.length > 0) {
        const existingImages = await product.getProductImages();
        const existingImageIds = existingImages.map((img) => img.id);

        await ProductImage.destroy({
          where: {
            productId: product.id,
            id: { [Sequelize.Op.in]: existingImageIds },
          },
        });

        const productImages = req.files.map((file, index) => ({
          productId: product.id,
          imageUrl: `/uploads/products/${file.filename}`,
          isPrimary: index === 0,
        }));

        await ProductImage.bulkCreate(productImages);
      }

      if (variants) {
        const incoming = JSON.parse(variants);
        const existing = product.Variants;

        const incomingIds = incoming.filter((v) => v.id).map((v) => v.id);
        const existingIds = existing.map((v) => v.id);

        const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
        if (toDelete.length > 0) {
          await Variant.destroy({
            where: { id: toDelete },
          });
        }

        for (const v of incoming) {
          if (v.id) {
            const variantInstance = existing.find((e) => e.id === v.id);

            await Variant.update(
              {
                name: v.name ?? variantInstance.name,
                price: v.price ?? variantInstance.price,
                stock: v.stock ?? variantInstance.stock,
                max_images: v.max_images ?? variantInstance.max_images,
              },
              { where: { id: v.id } }
            );
          } else {
            await Variant.create({
              productId: product.id,
              name: v.name,
              price: v.price,
              stock: v.stock,
              max_images: v.max_images ?? 1,
            });
          }
        }
      }

      const updatedProduct = await Product.findByPk(product.id, {
        include: [ProductImage, Variant, PhoneType],
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
      const { id } = req.params;
      console.log("Image ID to delete:", id);
      const image = await ProductImage.findByPk(id);
      if (!image) return res.status(404).json({ message: "Image not found" });

      const isPrimary = image.isPrimary;

      const filePath = path.join(__dirname, "..", image.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await image.destroy();

      const remainingImages = await ProductImage.findAll({
        where: { productId: image.productId },
      });

      if (isPrimary) {
        if (remainingImages.length > 0) {
          const newPrimaryImage = remainingImages[0];
          await newPrimaryImage.update({ isPrimary: true });
          console.log("New primary image set to:", newPrimaryImage.id);
        } else {
          console.log(
            "No primary image left, product has no primary image now."
          );
        }
      }

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
        include: [ProductImage, Variant],
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
      await Variant.destroy({ where: { productId: id } });

      await product.setPhoneTypes([]);

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
