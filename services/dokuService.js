const axios = require("axios");
const crypto = require("crypto");

const DOKU_URL = process.env.DOKU_URL;
const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY;
const DOKU_MERCHANT_CODE = process.env.DOKU_MERCHANT_CODE;

function generateSignature(requestBody, requestId, requestTarget, timestamp) {
  const bodyHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(requestBody))
    .digest("base64");
  const stringToSign = `Client-Id:${DOKU_CLIENT_ID}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}\nDigest:${bodyHash}`;
  const signature = crypto
    .createHmac("sha256", DOKU_SECRET_KEY)
    .update(stringToSign)
    .digest("base64");
  return `HMACSHA256=${signature}`;
}

module.exports = {
  createPayment: async ({ amount, orderId, email, name }) => {
    try {
      const requestId = crypto.randomUUID();
      const requestTarget = "/checkout/v1/payment";
      const timestamp = new Date().toISOString();

      const body = {
        order: {
          amount,
          invoice_number: `ORDER-${orderId}`,
          currency: "IDR",
        },
        payment: {
          payment_due_date: 60,
        },
        customer: {
          name,
          email,
        },
      };

      const signature = generateSignature(
        body,
        requestId,
        requestTarget,
        timestamp
      );

      const response = await axios.post(`${DOKU_URL}${requestTarget}`, body, {
        headers: {
          "Client-Id": DOKU_CLIENT_ID,
          "Request-Id": requestId,
          "Request-Timestamp": timestamp,
          Signature: signature,
          "Content-Type": "application/json",
        },
      });

      return {
        paymentUrl: response.data.response.payment.url,
        transactionId: response.data.response.transaction_id,
      };
    } catch (err) {
      console.error(
        "DOKU createPayment error:",
        err.response?.data || err.message
      );
      throw err;
    }
  },

  verifyCallback: (headers, body) => {
    const {
      signature,
      "request-id": requestId,
      "request-timestamp": timestamp,
      "request-target": target,
    } = headers;

    const bodyHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(body))
      .digest("base64");
    const stringToSign = `Client-Id:${DOKU_CLIENT_ID}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}\nDigest:${bodyHash}`;
    const expectedSignature = `HMACSHA256=${crypto
      .createHmac("sha256", DOKU_SECRET_KEY)
      .update(stringToSign)
      .digest("base64")}`;

    return signature === expectedSignature;
  },
};
