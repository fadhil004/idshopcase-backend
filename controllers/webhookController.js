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

    if (
      payment.status === "success" ||
      currentOrder.status === "paid" ||
      currentOrder.status === "delivered" ||
      currentOrder.status === "shipped"
    ) {
      console.log("Duplicate callback ignored:", orderId);
      return res.status(200).json({ message: "Callback already processed" });
    }

    if (transaction.status === "FAILED") {
      payment.status = "failed";
      currentOrder.status = "cancelled";
      await payment.save();
      await currentOrder.save();
      return res.status(200).json({ message: "Payment failed" });
    }

    if (transaction.status === "SUCCESS") {
      const t = await sequelize.transaction();

      try {
        currentOrder.status = "paid";
        payment.status = "success";

        const orderItems = await OrderItem.findAll({
          where: { orderId },
          transaction: t,
        });

        const productIds = orderItems.map((i) => i.productId);

        const products = await Product.findAll({
          where: { id: productIds },
          transaction: t,
        });

        for (const product of products) {
          const item = orderItems.find((i) => i.productId === product.id);
          product.stock = Math.max(product.stock - item.quantity, 0);
          await product.save({ transaction: t });
        }

        const address = await Address.findByPk(currentOrder.addressId, {
          include: [{ model: JntAddressMapping, as: "JntMapping" }],
          transaction: t,
        });

        const jntRes = await createJntOrder(currentOrder, address, orderItems);

        if (jntRes.success) {
          currentOrder.tracking_number = jntRes.waybill;

          currentOrder.status = "shipped";
        } else {
          console.error("Failed to create JNT waybill:", jntRes.reason);
        }

        await payment.save({ transaction: t });
        await currentOrder.save({ transaction: t });

        await t.commit();
      } catch (err) {
        console.error("Transaction rollback :", err);
        await t.rollback();
        return res
          .status(500)
          .json({ message: "Processing failed", error: err.message });
      }
      await redis.del(`order:${orderId}`);
      await redis.del("orders:all");
      await redis.del(`orders:user:${currentOrder.userId}`);

      for (const item of await OrderItem.findAll({ where: { orderId } })) {
        await redis.del(`product:${item.productId}`);
      }
      await redis.del("products:all");

      console.log("Callback SUCCESS processed for order:", orderId);

      return res.status(200).json({
        message: "Callback processed successfully",
        orderId,
        tracking_number: currentOrder.tracking_number,
      });
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
