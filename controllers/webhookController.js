const crypto = require("crypto");
const { Payment, Order, OrderItem, Product } = require("../models");

function verifyDokuSignature(headers, body, storedRequestId) {
  const clientId = headers["client-id"];
  const requestId = storedRequestId;
  const requestTimestamp = headers["request-timestamp"];
  const signatureHeader = headers["signature"];
  const requestTarget = "/api/doku/callback";
  const secretKey = process.env.DOKU_SECRET_KEY;

  const digest = crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("base64");

  const signatureComponent = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;

  const calculatedHmac = crypto
    .createHmac("sha256", secretKey)
    .update(signatureComponent)
    .digest("base64");

  const expectedSignature = `HMACSHA256=${calculatedHmac}`;

  console.log("🔍 DOKU SIGNATURE CHECK:");
  console.log("Expected:", expectedSignature);
  console.log("Received:", signatureHeader);
  console.log("Digest:", digest);
  console.log("String:", signatureComponent);
  console.log("StoredReqId", storedRequestId);
  console.log("==================================");

  return expectedSignature === signatureHeader;
}

exports.handleDokuCallback = async (req, res) => {
  console.log("========== DOKU CALLBACK RECEIVED ==========");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("============================================");
  const { order, transaction } = req.body;
  const orderId = order.invoice_number.split("-")[1];
  const orderReq = await Order.findByPk(orderId);

  if (!order?.invoice_number) {
    return res.status(400).json({ message: "Missing order invoice" });
  }
  const requestId = orderReq.requestId;

  //   const isValid = verifyDokuSignature(req.headers, req.body, requestId);
  //   if (!isValid) {
  //     console.error("Invalid DOKU Signature");
  //     return res.status(403).json({ message: "Invalid signature" });
  //   }

  const currentOrder = await Order.findByPk(orderId);
  if (!currentOrder)
    return res.status(404).json({ message: "Order not found" });

  // Update status pembayaran & order
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
  } else if (transaction.status === "FAILED") {
    currentOrder.status = "cancelled";
    payment.status = "failed";
  }

  await currentOrder.save();
  await payment.save();

  console.log("Callback processed for order:", orderId);

  return res.status(200).json({ message: "Callback processed successfully" });
};
