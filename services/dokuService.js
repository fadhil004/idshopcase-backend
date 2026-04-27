const axios = require("axios");
const crypto = require("crypto");

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY;
const DOKU_MERCHANT_URL = process.env.DOKU_MERCHANT_URL;
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";

function isoTimestampNoMs(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function generateSignature(requestId, timestamp, requestTarget, requestBody) {
  const digest = crypto
    .createHash("sha256")
    .update(JSON.stringify(requestBody))
    .digest("base64");

  const signatureBase =
    `Client-Id:${DOKU_CLIENT_ID}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`;

  return crypto
    .createHmac("sha256", DOKU_SECRET_KEY)
    .update(signatureBase)
    .digest("base64");
}

async function createDokuCheckout(order, user, requestId) {
  const requestTarget = "/checkout/v1/payment";
  const timestamp = isoTimestampNoMs();

  const body = {
    order: {
      amount: Number(order.total_price),
      invoice_number: `INV-${order.id}-${Date.now()}`,
      currency: "IDR",
    },
    payment: { payment_due_date: 60 },
    customer: {
      name: user.name,
      email: user.email,
    },
    redirect: {
      success_url: `${APP_BASE_URL}/payment/success`,
      failure_url: `${APP_BASE_URL}/payment/failure`,
      cancel_url: `${APP_BASE_URL}/payment/cancel`,
    },
  };

  const headers = {
    "Client-Id": DOKU_CLIENT_ID,
    "Request-Id": requestId,
    "Request-Timestamp": timestamp,
    Signature: `HMACSHA256=${generateSignature(requestId, timestamp, requestTarget, body)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // only log minimal info — never log credentials or full request bodies
  console.log(`[DOKU] Creating checkout for order ${order.id}`);

  try {
    const response = await axios.post(DOKU_MERCHANT_URL, body, { headers });
    console.log(`[DOKU] Checkout created successfully for order ${order.id}`);
    return response.data;
  } catch (error) {
    console.error(
      `[DOKU] Checkout failed for order ${order.id}:`,
      error.response?.status || error.message,
    );
    throw new Error("Failed to create DOKU Checkout session");
  }
}

module.exports = { createDokuCheckout };
