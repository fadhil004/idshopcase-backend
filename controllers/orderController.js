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

exports.getOrderSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, selectedItemIds } = req.body;

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
      (acc, item) => acc + parseFloat(item.price),
      0
    );

    const totalWeight = cart.CartItems.reduce(
      (acc, item) => acc + 0.1 * item.quantity,
      0
    );

    const {
      cost: shippingCost,
      name: shippingService,
      error: shippingError,
    } = await getShippingCost({
      weight: totalWeight,
      sendSiteCode: "CIBINONG",
      destAreaCode: "BUKIT RAYA-PKU",
    });

    if (shippingError) {
      throw new Error(`Failed to get shipping cost: ${shippingError}`);
    }

    const totalPrice = subtotal + shippingCost;

    return res.json({
      message: "Order summary calculated",
      data: {
        items: cart.CartItems.map((item) => ({
          id: item.id,
          name: item.Product.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.price),
        })),
        subtotal,
        shipping: {
          courier: "J&T Express",
          service: shippingService,
          cost: shippingCost,
        },
        total: totalPrice,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get order summary",
      error: error.message,
    });
  }
};

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
      (acc, item) => acc + parseFloat(item.price),
      0
    );

    const totalWeight = cart.CartItems.reduce(
      (acc, item) => acc + 0.1 * item.quantity,
      0
    );

    const { cost: shippingCost, error: shippingError } = await getShippingCost({
      weight: totalWeight,
      sendSiteCode: "CIBINONG", // asal pengiriman
      destAreaCode: "BUKIT RAYA-PKU", // kode kecamatan tujuan
    });

    if (shippingError) {
      throw new Error(`Failed to get shipping cost: ${shippingError}`);
    }
    console.log("===========", shippingCost);
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
