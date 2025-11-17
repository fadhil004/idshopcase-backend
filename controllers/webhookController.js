const {
  Payment,
  Order,
  OrderItem,
  Product,
  Address,
  JntAddressMapping,
} = require("../models");
const { createJntOrder } = require("../services/jntService");

exports.handleDokuCallback = async (req, res) => {
  console.log("========== DOKU CALLBACK RECEIVED ==========");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("============================================");

  try {
    const { order, transaction } = req.body;
    if (!order?.invoice_number) {
      return res.status(400).json({ message: "Missing order invoice" });
    }

    const orderId = order.invoice_number.split("-")[1];
    const currentOrder = await Order.findByPk(orderId);
    if (!currentOrder)
      return res.status(404).json({ message: "Order not found" });

    const payment = await Payment.findOne({ where: { orderId } });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (transaction.status === "SUCCESS") {
      currentOrder.status = "paid";
      payment.status = "success";

      const orderItems = await OrderItem.findAll({ where: { orderId } });
      for (const item of orderItems) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          product.stock = Math.max(product.stock - item.quantity, 0);
          await product.save();
        }
      }

      // CREATE JNT WAYBILL HERE
      const address = await Address.findByPk(currentOrder.addressId, {
        include: [{ model: JntAddressMapping, as: "JntMapping" }],
      });
      const jntRes = await createJntOrder(currentOrder, address, orderItems);

      if (jntRes.success) {
        currentOrder.tracking_number = jntRes.waybill;
        currentOrder.status = "shipped"; // optionally mark as shipped
      } else {
        console.error("Failed to create JNT waybill:", jntRes.reason);
      }

      await currentOrder.save();
      await payment.save();

      console.log("Callback processed for order:", orderId);
      return res.status(200).json({
        message: "Callback processed successfully",
        orderId,
        tracking_number: currentOrder.tracking_number,
      });
    } else if (transaction.status === "FAILED") {
      currentOrder.status = "cancelled";
      payment.status = "failed";
      await currentOrder.save();
      await payment.save();
      return res.status(200).json({ message: "Payment failed" });
    }

    return res.status(200).json({ message: "Unhandled status" });
  } catch (error) {
    console.error("Callback processing error:", error);
    return res.status(500).json({
      message: "Callback processing failed",
      error: error.message,
    });
  }
};
