const {
  Cart,
  CartItem,
  Product,
  CustomImage,
  Order,
  OrderItem,
  Payment,
  Address,
} = require("../models");
const jntService = require("../services/jntService");
const dokuService = require("../services/dokuService");

module.exports = {
  checkout: async (req, res) => {
    try {
      const userId = req.user.id;
      const { addressId, selectedItems, paymentMethod } = req.body;

      const address = await Address.findByPk(addressId);
      if (!address)
        return res.status(404).json({ message: "Address not found" });

      const cartItems = await CartItem.findAll({
        where: { id: selectedItems },
        include: [Product],
      });
      if (!cartItems.length)
        return res.status(400).json({ message: "No selected items" });

      const subtotal = cartItems.reduce(
        (acc, item) => acc + Number(item.price),
        0
      );

      const origin = "BGR"; // contoh kode kota asal
      const destAreaCode = address.district; // sesuaikan nanti dari mapping district J&T
      const weight = cartItems.reduce(
        (acc, item) => acc + item.Product.weight,
        0
      );

      const shippingRate = await jntService.getRate({
        weight,
        sendSiteCode: origin,
        destAreaCode,
      });

      const shippingCost = shippingRate?.cost || 0;
      const totalPrice = subtotal + shippingCost;

      const order = await Order.create({
        userId,
        addressId,
        total_price: totalPrice,
        payment_method: paymentMethod || "DOKU",
        status: "pending",
      });

      for (const item of cartItems) {
        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          customImageId: item.customImageId,
          quantity: item.quantity,
          price: item.price,
        });
        await item.destroy();
      }

      const payment = await Payment.create({
        orderId: order.id,
        payment_gateway: "DOKU",
        amount: totalPrice,
        status: "pending",
      });

      const paymentResponse = await dokuService.createCheckout(order, payment);

      return res.status(201).json({
        message: "Order created",
        order,
        paymentUrl: paymentResponse.payment_url,
        total: totalPrice,
        shippingCost,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  paymentCallback: async (req, res) => {
    try {
      const { orderId, transactionStatus, transactionId } = req.body;

      const order = await Order.findByPk(orderId, {
        include: [Payment, Address],
      });
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (transactionStatus === "SUCCESS") {
        order.status = "paid";
        order.Payment.status = "success";
        order.Payment.transaction_id = transactionId;
        await order.save();
        await order.Payment.save();

        // Integrasi ke J&T — generate waybill
        const jntResponse = await jntService.createOrder(order, order.Address);

        order.tracking_number = jntResponse.awb_no;
        await order.save();
      }

      return res.json({ message: "Callback processed" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  trackOrder: async (req, res) => {
    try {
      const { awb } = req.params;
      const tracking = await jntService.trackOrder(awb);
      return res.json(tracking);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findByPk(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const cancel = await jntService.cancelOrder(order.id);
      if (cancel.success) {
        order.status = "cancelled";
        await order.save();
      }

      return res.json({ message: "Order cancelled", cancel });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },
};
