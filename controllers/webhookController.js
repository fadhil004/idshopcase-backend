const { Payment, Order, OrderItem, Variant, sequelize } = require("../models");
const redis = require("../config/redis");
const crypto = require("crypto");

/**
 * Verifikasi signature DOKU pada callback.
 * DOKU mengirim header "Signature" dengan format "HMACSHA256=<base64>"
 * dihitung dari: Client-Id + Request-Id + Request-Timestamp + Request-Target + Digest(body)
 */
function verifyDokuSignature(req) {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secretKey = process.env.DOKU_SECRET_KEY;

  // Fail closed — never skip signature verification
  if (!clientId || !secretKey) {
    console.error(
      "[WEBHOOK] DOKU_CLIENT_ID/DOKU_SECRET_KEY not set — rejecting all callbacks",
    );
    return false;
  }

  const incomingSignature = req.headers["signature"];
  const requestId = req.headers["request-id"];
  const timestamp = req.headers["request-timestamp"];
  const requestTarget = req.path;

  if (!incomingSignature || !requestId || !timestamp) {
    console.error("[WEBHOOK] Header DOKU tidak lengkap:", {
      signature: !!incomingSignature,
      requestId: !!requestId,
      timestamp: !!timestamp,
    });
    return false;
  }

  const digest = crypto
    .createHash("sha256")
    .update(JSON.stringify(req.body))
    .digest("base64");

  const signatureBase =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`;

  const expectedSignature =
    "HMACSHA256=" +
    crypto
      .createHmac("sha256", secretKey)
      .update(signatureBase)
      .digest("base64");

  // timingSafeEqual mencegah timing attack
  try {
    const a = Buffer.from(incomingSignature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

exports.handleDokuCallback = async (req, res) => {
  console.log("[WEBHOOK] DOKU callback received:", req.method, req.path);

  // Verifikasi signature SEBELUM proses apapun
  if (!verifyDokuSignature(req)) {
    console.error("[WEBHOOK] Signature DOKU tidak valid — request ditolak");
    return res.status(401).json({ message: "Invalid signature" });
  }

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

      await redis.del(`order:user:${currentOrder.userId}:${orderId}`);
      await redis.del(`orders:user:${currentOrder.userId}`);
      await redis.del(`admin:order:${orderId}`);
      await redis.del(`admin:orders:all`);
      await redis.del(`admin:orders:pending`);

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

        // Atomic decrement stok — hindari race condition
        for (const item of orderItems) {
          const updated = await Variant.decrement("stock", {
            by: item.quantity,
            where: {
              id: item.variantId,
              stock: { [require("sequelize").Op.gte]: item.quantity },
            },
            transaction: t,
          });

          // Jika tidak ada baris yang diupdate, stok tidak cukup
          if (!updated[0][1]) {
            console.warn(
              `[WEBHOOK] Stok variant ${item.variantId} tidak cukup untuk order ${orderId}`,
            );
          }
        }

        await payment.save({ transaction: t });
        await currentOrder.save({ transaction: t });

        await t.commit();

        // Invalidate semua cache yang relevan
        await redis.del(`order:user:${currentOrder.userId}:${orderId}`);
        await redis.del(`orders:user:${currentOrder.userId}`);
        await redis.del(`admin:order:${orderId}`);
        await redis.del(`admin:orders:all`);
        await redis.del(`admin:orders:pending`);
        await redis.del(`admin:orders:paid`);

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
        console.error("[WEBHOOK] Transaction error:", err);
        return res.status(500).json({
          message: "Processing failed",
          error:
            process.env.NODE_ENV !== "production" ? err.message : undefined,
        });
      }
    }

    return res.status(200).json({ message: "Unhandled status" });
  } catch (error) {
    console.error("Callback processing error:", error);
    return res.status(500).json({
      message: "Callback processing failed",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};
