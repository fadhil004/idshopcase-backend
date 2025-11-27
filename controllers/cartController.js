const {
  Cart,
  CartItem,
  Product,
  Variant,
  PhoneType,
  ProductImage,
  ProductPhoneType,
} = require("../models");
const redis = require("../config/redis");

module.exports = {
  getCart: async (req, res) => {
    try {
      const userId = req.user.id;

      const cached = await redis.get(`cart:${userId}`);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            include: [
              {
                model: Product,
                include: [{ model: ProductImage }, { model: PhoneType }],
              },
              Variant,
              PhoneType,
            ],
          },
        ],
      });

      if (!cart) return res.status(404).json({ message: "Cart not found" });

      await redis.setex(`cart:${userId}`, 120, JSON.stringify(cart));

      return res.json(cart);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  addToCart: async (req, res) => {
    try {
      const userId = req.user.id;

      const { productId, quantity, phoneTypeId, variantId } = req.body;

      if (!variantId)
        return res.status(400).json({ message: "variantId is required" });

      if (!quantity || quantity < 1)
        return res.status(400).json({ message: "Invalid quantity" });

      const product = await Product.findByPk(productId, {
        include: [ProductImage, PhoneType, Variant],
      });

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      const variant = await Variant.findOne({
        where: { id: variantId, productId },
      });

      if (!variant)
        return res
          .status(404)
          .json({ message: "Variant does not belong to this product" });

      if (quantity > variant.stock)
        return res
          .status(400)
          .json({ message: `Stock insufficient. Only ${variant.stock} left` });

      const [cart] = await Cart.findOrCreate({ where: { userId } });

      const existingItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          productId,
          phoneTypeId: phoneTypeId || null,
          variantId,
        },
        include: [Variant],
      });

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = existingItem.Variant.price * existingItem.quantity;
        await existingItem.save();

        await redis.del(`cart:${userId}`);

        return res.json({ message: "Cart updated", item: existingItem });
      }

      const newItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
        phoneTypeId: phoneTypeId || null,
        variantId,
        price: variant.price * quantity,
      });

      await redis.del(`cart:${userId}`);
      return res.status(201).json({ message: "Item added", item: newItem });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  updateCartItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, phoneTypeId, variantId } = req.body;

      const item = await CartItem.findByPk(id, {
        include: [{ model: Product, include: [PhoneType, Variant] }, Variant],
      });
      if (!item) return res.status(404).json({ message: "Item not found" });

      let selectedVariant = item.Variant;

      if (variantId) {
        selectedVariant = await Variant.findOne({
          where: {
            id: variantId,
            productId: item.productId,
          },
        });

        if (!selectedVariant)
          return res
            .status(404)
            .json({ message: "Variant does not belong to this product" });

        item.variantId = variantId;
      }

      if (phoneTypeId) {
        const validPhoneType = item.Product.PhoneTypes.some(
          (pt) => pt.id === Number(phoneTypeId)
        );

        if (!validPhoneType) {
          return res.status(400).json({
            message: "Phone type not available for this product",
          });
        }

        item.phoneTypeId = phoneTypeId;
      }

      const qty = quantity || item.quantity;

      if (qty > selectedVariant.stock)
        return res.status(400).json({
          message: `Stock insufficient. Only ${selectedVariant.stock} left`,
        });

      item.quantity = quantity;
      item.price = item.Variant.price * quantity;
      await item.save();

      await redis.del(`cart:${item.cartId}`);
      await redis.del(`cart:${item.userId}`);
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
      if (!item) return res.status(404).json({ message: "Item not found" });

      await item.destroy();
      await redis.del(`cart:${item.userId}`);
      await redis.del(`cart:${item.cartId}`);
      return res.json({ message: "Item removed from cart" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },
};
