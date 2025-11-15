const {
  Cart,
  CartItem,
  Product,
  CustomImage,
  Material,
  Variant,
  PhoneType,
  ProductImage,
} = require("../models");

module.exports = {
  getCart: async (req, res) => {
    try {
      const userId = req.user.id;

      const cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            include: [Product, CustomImage],
          },
        ],
      });

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      return res.json(cart);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  addToCart: async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId, customImageId, quantity } = req.body;

      const product = await Product.findByPk(productId, {
        iinclude: [
          { model: ProductImage, attributes: ["id", "imageUrl", "isPrimary"] },
          { model: Material, attributes: ["id", "name"] },
          { model: Variant, attributes: ["id", "name"] },
          { model: PhoneType, attributes: ["id", "brand", "model"] },
        ],
      });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const [cart] = await Cart.findOrCreate({ where: { userId } });

      const existingItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          productId,
          customImageId: customImageId || null,
        },
        include: [Product],
      });

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = existingItem.Product.price * existingItem.quantity;
        await existingItem.save();

        return res.json({ message: "Cart item updated", item: existingItem });
      } else {
        const newItem = await CartItem.create({
          cartId: cart.id,
          productId,
          customImageId: customImageId || null,
          quantity,
          price: product.price * quantity,
        });

        return res
          .status(201)
          .json({ message: "Item added to cart", item: newItem });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  updateCartItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const item = await CartItem.findByPk(id, { include: [Product] });
      if (!item) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      item.quantity = quantity;
      item.price = item.Product.price * quantity;
      await item.save();

      return res.json({ message: "Cart item updated", item });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  removeCartItem: async (req, res) => {
    try {
      const { id } = req.params;

      const item = await CartItem.findByPk(id);
      if (!item) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      await item.destroy();
      return res.json({ message: "Item removed from cart" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },
};
