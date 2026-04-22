const { Order } = require("../models");
const axios = require("axios");
const crypto = require("crypto");
const redis = require("../config/redis");

const getShippingCost = async ({ weight, sendSiteCode, destAreaCode }) => {
  try {
    const cusName = process.env.JNT_USERNAME;
    const key = process.env.JNT_KEY_TARIFF;
    const apiUrl = process.env.JNT_TARIFF_URL;
    const productType = "EZ";

    const dataJson = {
      weight: String(weight),
      sendSiteCode,
      destAreaCode,
      cusName,
      productType,
    };

    const data_param = JSON.stringify(dataJson);

    const signHex = Buffer.from(
      crypto
        .createHash("md5")
        .update(data_param + key)
        .digest("hex"),
    ).toString("base64");

    const body = new URLSearchParams({
      data: data_param,
      sign: signHex,
    }).toString();

    const response = await axios.post(apiUrl, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const result = response.data;

    // log only non-sensitive summary info
    if (result.is_success === "true") {
      const content = JSON.parse(result.content);
      const cost = parseInt(content[0].cost);
      return { courier: "JNT", cost, name: content[0].name };
    } else {
      console.error("[JNT] Tariff API error:", result.message);
      return { courier: "JNT", cost: 0, error: result.message };
    }
  } catch (err) {
    console.error("[JNT] Shipping cost error:", err.message);
    return { courier: "JNT", cost: 0, error: err.message };
  }
};

const createJntOrder = async (order, address, orderItems) => {
  try {
    const key = process.env.JNT_KEY_ORDER;
    const username = process.env.JNT_USERNAME;
    const api_key = process.env.JNT_API_KEY_ORDER;
    const apiUrl = process.env.JNT_ORDER_URL;

    const now = new Date();
    const formattedDate = now.toISOString().replace("T", " ").substring(0, 19);

    const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalWeight = orderItems.reduce(
      (sum, item) => sum + 0.1 * item.quantity,
      0,
    );

    const mapping = address.JntMapping;
    if (!mapping) throw new Error("Missing J&T mapping for this address");

    const data = {
      username,
      api_key,
      orderid: `IDSHOP-${order.id}`,
      shipper_name: "IDSHOPCASE",
      shipper_contact: "IDSHOPCASE",
      shipper_phone: process.env.SHIPPER_PHONE || "",
      shipper_addr: process.env.SHIPPER_ADDRESS || "",
      origin_code: process.env.JNT_ORIGIN_CODE || "CIB",
      receiver_name: address.recipient_name,
      receiver_phone: address.phone,
      receiver_addr: `${address.details}, ${address.district}, ${address.city}, ${address.province}`,
      receiver_zip: address.postal_code || "00000",
      destination_code: mapping.jnt_city_code,
      receiver_area: mapping.jnt_area_code,
      qty: totalQty,
      weight: totalWeight,
      goodsdesc: "Custom Phone Case & Accessories",
      servicetype: 1,
      insurance: "",
      orderdate: formattedDate,
      item_name: "Phone Case",
      cod: "",
      sendstarttime: formattedDate,
      sendendtime: formattedDate,
      expresstype: "1",
      goodsvalue: parseInt(order.total_price),
    };

    const data_json = JSON.stringify({ detail: [data] });
    const sign = Buffer.from(
      crypto
        .createHash("md5")
        .update(data_json + key)
        .digest("hex"),
    ).toString("base64");

    const body = new URLSearchParams({
      data_param: data_json,
      data_sign: sign,
    }).toString();

    const response = await axios.post(apiUrl, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const result = response.data;

    // log only order ID and success status — never log credentials or full bodies
    if (result.success && result.detail && result.detail[0].awb_no) {
      console.log(
        `[JNT] Order ${order.id} created, AWB: ${result.detail[0].awb_no}`,
      );
      return {
        success: true,
        waybill: result.detail[0].awb_no,
        etd: result.detail[0].etd,
      };
    } else {
      console.error(
        `[JNT] Order ${order.id} failed:`,
        result.detail?.[0]?.reason || "Unknown error",
      );
      return {
        success: false,
        reason: result.detail?.[0]?.reason || "Unknown error",
      };
    }
  } catch (err) {
    console.error("[JNT] Order API error:", err.message);
    return { success: false, reason: err.message };
  }
};

const trackJntShipment = async (awb) => {
  try {
    const url = process.env.JNT_TRACK_URL;
    const eccompanyid = process.env.JNT_USERNAME;
    const username = process.env.JNT_USERNAME;
    const password = process.env.JNT_PW_TRACK;

    const cacheKey = `track:${awb}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      await checkAndUpdateDelivered(parsed, awb);
      return parsed;
    }

    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const response = await axios.post(
      url,
      JSON.stringify({ awb, eccompanyid }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      },
    );

    const result = response.data;
    await redis.setex(cacheKey, 600, JSON.stringify(result));
    await checkAndUpdateDelivered(result, awb);
    return result;
  } catch (error) {
    console.error(
      "[JNT] Tracking error:",
      error.response?.data?.error_message || error.message,
    );
    return {
      error: true,
      message:
        error.response?.data?.error_message ||
        "Failed to track shipment. Please try again later.",
    };
  }
};

const checkAndUpdateDelivered = async (trackingData, awb) => {
  try {
    if (!trackingData || !Array.isArray(trackingData.history)) return;
    const latest = trackingData.history[trackingData.history.length - 1];
    if (!latest) return;

    if (String(latest.status_code) === "200") {
      const order = await Order.findOne({ where: { tracking_number: awb } });
      if (order && order.status !== "delivered") {
        order.status = "delivered";
        await order.save();
        console.log(`[JNT] Order ${order.id} marked as delivered`);
      }
    }
  } catch (err) {
    console.error("[JNT] Failed to update delivered status:", err.message);
  }
};

module.exports = { getShippingCost, createJntOrder, trackJntShipment };
