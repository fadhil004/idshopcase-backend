const {
  Cart,
  CartItem,
  Product,
  Address,
  Order,
  OrderItem,
  Payment,
  User,
} = require("../models");
const { getShippingCost } = require("../services/jntService");
const { createDokuCheckout } = require("../services/dokuService");
const crypto = require("crypto");

exports.createOrder = async (req, res) => {
  const t = await Order.sequelize.transaction();
  try {
    const userId = req.user.id;
    const { addressId, selectedItemIds } = req.body;

    const user = await User.findByPk(userId);
    const address = await Address.findByPk(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          include: [Product],
          where: { id: selectedItemIds },
        },
      ],
    });

    if (!cart || cart.CartItems.length === 0)
      return res.status(400).json({ message: "No selected items found" });

    const subtotal = cart.CartItems.reduce(
      (acc, item) => acc + parseFloat(item.price) * item.quantity,
      0
    );

    const { cost: shippingCost } = await getShippingCost(address);
    const totalPrice = subtotal + shippingCost;

    const requestId = crypto.randomUUID();

    const order = await Order.create(
      {
        userId,
        addressId,
        total_price: totalPrice,
        payment_method: "DOKU Checkout",
        status: "pending",
        requestId,
      },
      { transaction: t }
    );

    for (const item of cart.CartItems) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        },
        { transaction: t }
      );

      await item.destroy({ transaction: t });
    }

    const payment = await Payment.create(
      {
        orderId: order.id,
        payment_gateway: "DOKU",
        amount: totalPrice,
        status: "pending",
      },
      { transaction: t }
    );

    const dokuResponse = await createDokuCheckout(order, user, requestId);

    await t.commit();

    res.status(201).json({
      message: "Order created successfully",
      order,
      payment,
      checkout: dokuResponse,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create order", error: error.message });
  }
};
