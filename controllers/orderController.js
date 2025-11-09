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
const { getShippingCost, trackJntShipment } = require("../services/jntService");
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

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "price", "image"],
            },
          ],
        },
        {
          model: Payment,
          attributes: ["id", "payment_gateway", "status", "amount"],
        },
        {
          model: Address,
          attributes: [
            "id",
            "recipient_name",
            "phone",
            "province",
            "city",
            "district",
            "postal_code",
            "details",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!orders || orders.length === 0)
      return res.status(404).json({ message: "No orders found" });

    return res.json({ message: "Orders retrieved", orders });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve orders", error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "price", "image"],
            },
          ],
        },
        {
          model: Payment,
          attributes: ["id", "payment_gateway", "status", "amount"],
        },
        {
          model: Address,
          attributes: [
            "id",
            "recipient_name",
            "phone",
            "province",
            "city",
            "district",
            "postal_code",
            "details",
          ],
        },
      ],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    return res.json({ message: "Order detail retrieved", order });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to get order detail", error: error.message });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.tracking_number) {
      return res
        .status(400)
        .json({ message: "Order does not have waybill yet" });
    }

    const trackingData = await trackJntShipment(order.tracking_number);

    if (trackingData.error_id) {
      return res.status(400).json({
        message: trackingData.error_message || "Failed to get tracking data",
      });
    }

    return res.json({
      message: "Tracking data retrieved successfully",
      tracking: trackingData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to track order",
      error: error.message,
    });
  }
};
