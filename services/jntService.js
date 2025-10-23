const axios = require("axios");
const crypto = require("crypto");

const JNT_URL = process.env.JNT_URL;
const JNT_USERNAME = process.env.JNT_USERNAME;
const JNT_API_KEY = process.env.JNT_API_KEY;
const JNT_KEY = process.env.JNT_KEY;

function generateSignature(data) {
  const md5Hash = crypto
    .createHash("md5")
    .update(data + JNT_KEY)
    .digest("hex");
  return Buffer.from(md5Hash).toString("base64");
}

module.exports = {
  createOrder: async (order, address) => {
    try {
      const orderData = {
        username: JNT_USERNAME,
        api_key: JNT_API_KEY,
        orderid: `ORDER-${order.id}`,
        shipper_name: "Your Store Name",
        shipper_contact: "Your Store",
        shipper_phone: "+628123456789",
        shipper_addr: "Jl. Contoh No. 1, Jakarta",
        origin_code: "JKT",
        receiver_name: address.recipient_name,
        receiver_phone: address.phone,
        receiver_addr: `${address.province}, ${address.city}, ${address.district}, ${address.details}`,
        receiver_zip: address.postal_code || "00000",
        destination_code: "JKT", // nanti bisa disesuaikan
        receiver_area: "JKT001", // nanti bisa disesuaikan
        qty: 1,
        weight: 1.0,
        goodsdesc: "Custom phone case",
        servicetype: 1,
        insurance: "",
        orderdate: new Date().toISOString().slice(0, 19).replace("T", " "),
        item_name: "Custom Product",
        expresstype: "1",
        goodsvalue: Math.floor(order.total_price),
      };

      const data_json = JSON.stringify({ detail: [orderData] });
      const data_sign = generateSignature(data_json);

      const formBody = new URLSearchParams();
      formBody.append("data_param", data_json);
      formBody.append("data_sign", data_sign);

      const response = await axios.post(`${JNT_URL}/order`, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data?.detail?.[0]?.awb_no) {
        return response.data.detail[0];
      } else {
        throw new Error(
          response.data?.detail?.[0]?.reason || "Failed to create J&T order"
        );
      }
    } catch (err) {
      console.error("J&T createOrder error:", err.message);
      throw err;
    }
  },

  trackOrder: async (awb) => {
    try {
      const payload = {
        awb,
        eccompanyid: JNT_USERNAME,
      };

      const auth = Buffer.from(`${JNT_USERNAME}:${JNT_API_KEY}`).toString(
        "base64"
      );

      const response = await axios.post(`${JNT_URL}/track`, payload, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (err) {
      console.error("J&T trackOrder error:", err.message);
      throw err;
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const data = {
        username: JNT_USERNAME,
        api_key: JNT_API_KEY,
        orderid: `ORDER-${orderId}`,
        remark: "Cancelled by system",
      };

      const data_json = JSON.stringify({ detail: [data] });
      const data_sign = generateSignature(data_json);

      const formBody = new URLSearchParams();
      formBody.append("data_param", data_json);
      formBody.append("data_sign", data_sign);

      const response = await axios.post(`${JNT_URL}/cancelOrder`, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      return response.data;
    } catch (err) {
      console.error("J&T cancelOrder error:", err.message);
      throw err;
    }
  },

  checkTariff: async (origin, destination, weight) => {
    try {
      const data = {
        weight,
        sendSiteCode: origin,
        destAreaCode: destination,
        cusName: JNT_USERNAME,
        productType: "EZ",
      };

      const json = JSON.stringify(data);
      const sign = generateSignature(json);

      const formBody = new URLSearchParams();
      formBody.append("data", json);
      formBody.append("sign", sign);

      const response = await axios.post(`${JNT_URL}/tariff`, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      return response.data;
    } catch (err) {
      console.error("J&T checkTariff error:", err.message);
      throw err;
    }
  },
};
