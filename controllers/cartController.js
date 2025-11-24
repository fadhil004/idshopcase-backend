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
                include: [
                  { model: ProductImage },
                  { model: Material },
                  { model: Variant },
                  { model: PhoneType },
                ],
              },
              CustomImage,
              Material,
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

      const {
        productId,
        customImageId,
        quantity,
        phoneTypeId,
        materialId,
        variantId,
      } = req.body;

      const product = await Product.findByPk(productId, {
        include: [
          { model: ProductImage },
          { model: Material },
          { model: Variant },
          { model: PhoneType },
        ],
      });

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      const [cart] = await Cart.findOrCreate({ where: { userId } });

      const existingItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          productId,
          customImageId: customImageId || null,
          phoneTypeId: phoneTypeId || null,
          materialId: materialId || null,
          variantId: variantId || null,
        },
        include: [Product],
      });

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = existingItem.Product.price * existingItem.quantity;
        await existingItem.save();

        await redis.del(`cart:${userId}`);

        return res.json({ message: "Cart updated", item: existingItem });
      }

      const newItem = await CartItem.create({
        cartId: cart.id,
        productId,
        customImageId: customImageId || null,
        quantity,
        phoneTypeId: phoneTypeId || null,
        materialId: materialId || null,
        variantId: variantId || null,
        price: product.price * quantity,
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
      const { quantity } = req.body;

      const item = await CartItem.findByPk(id, { include: [Product] });
      if (!item) return res.status(404).json({ message: "Item not found" });

      item.quantity = quantity;
      item.price = item.Product.price * quantity;
      await item.save();

      await redis.del(`cart:${item.cartId}`);
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
      await redis.del(`cart:${item.cartId}`);
      return res.json({ message: "Item removed from cart" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },
};
