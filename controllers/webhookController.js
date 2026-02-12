const {
  Payment,
  Order,
  OrderItem,
  Variant,
  Address,
  JntAddressMapping,
  sequelize,
} = require("../models");
const redis = require("../config/redis");
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

      await redis.del(`order:${orderId}`);
      await redis.del(`order:summary:${orderId}`);
      await redis.del(`orders:user:${currentOrder.userId}`);
      await redis.del("orders:all");

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

        const variantIds = orderItems.map((i) => i.variantId);

        const variants = await Variant.findAll({
          where: { id: variantIds },
          transaction: t,
        });

        for (const variant of variants) {
          const item = orderItems.find((i) => i.variantId === variant.id);
          variant.stock = Math.max(variant.stock - item.quantity, 0);
          await variant.save({ transaction: t });
        }

        await payment.save({ transaction: t });
        await currentOrder.save({ transaction: t });

        await t.commit();

        await redis.del(`order:${orderId}`);
        await redis.del(`order:summary:${orderId}`);
        await redis.del(`orders:user:${currentOrder.userId}`);
        await redis.del("orders:all");

        for (const item of orderItems) {
          await redis.del(`product:${item.productId}`);
        }
        await redis.del("products:all");

        console.log("Callback SUCCESS processed for order:", orderId);

        return res.status(200).json({
          message: "Callback processed successfully",
          orderId,
        });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({
          message: "Processing failed",
          error: err.message,
        });
      }
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
