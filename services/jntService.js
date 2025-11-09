const axios = require("axios");
const crypto = require("crypto");

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
        .digest("hex")
    ).toString("base64");

    const body = new URLSearchParams({
      data: data_param,
      sign: signHex,
    }).toString();

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const response = await axios.post(apiUrl, body, { headers });

    const result = response.data;

    if (result.is_success === "true") {
      const content = JSON.parse(result.content);
      const cost = parseInt(content[0].cost);
      return { courier: "JNT", cost, name: content[0].name };
    } else {
      console.log(sign);
      console.log(signHex);
      console.log(data_param);
      console.log(result);
      console.error("J&T Tariff API Error:", result.message);
      return { courier: "JNT", cost: 0, error: result.message };
    }
  } catch (err) {
    console.error("J&T Shipping Cost Error:", err.message);
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
    const formattedDate = now.toISOString().replace("T", " ").substring(0, 19); // YYYY-MM-DD hh:mm:ss

    const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalWeight = orderItems.reduce(
      (sum, item) => sum + 0.1 * item.quantity, // default 0.1kg/item
      0
    );

    const mapping = address.JntMapping;
    if (!mapping) {
      throw new Error("Missing J&T mapping for this address");
    }

    const data = {
      username,
      api_key,
      orderid: `IDSHOP-${order.id}`,
      shipper_name: "IDSHOPCASE",
      shipper_contact: "IDSHOPCASE",
      shipper_phone: "+6281278820864",
      shipper_addr:
        "Ciomas Hills Cluster Malabar blok A31/3 Sukamakmur, Kecamatan Ciomas, Kabupaten Bogor, Provinsi Jawa Barat",
      origin_code: "CIB",
      receiver_name: address.recipient_name,
      receiver_phone: address.phone,
      receiver_addr: `${address.details}, ${address.district}, ${address.city}, ${address.province}`,
      receiver_zip: address.postal_code || "00000",
      destination_code: mapping.jnt_city_code, // sesuaikan kalau kamu punya mapping code
      receiver_area: mapping.jnt_area_code, // sesuaikan juga
      qty: totalQty,
      weight: totalWeight,
      goodsdesc: "Custom Phone Case & Accessories",
      servicetype: 1, // 1 = Pickup
      insurance: "",
      orderdate: formattedDate,
      item_name: "Phone Case",
      cod: "",
      sendstarttime: formattedDate,
      sendendtime: formattedDate,
      expresstype: "1", // EZ
      goodsvalue: parseInt(order.total_price),
    };

    const data_json = JSON.stringify({ detail: [data] });
    const sign = Buffer.from(
      crypto
        .createHash("md5")
        .update(data_json + key)
        .digest("hex")
    ).toString("base64");

    const body = new URLSearchParams({
      data_param: data_json,
      data_sign: sign,
    }).toString();

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const response = await axios.post(apiUrl, body, { headers });
    const result = response.data;

    if (result.success && result.detail && result.detail[0].awb_no) {
      console.log("J&T Order Success:", result.detail[0]);
      return {
        success: true,
        waybill: result.detail[0].awb_no,
        etd: result.detail[0].etd,
      };
    } else {
      console.error("J&T Order Error:", result.detail?.[0] || result);
      return {
        success: false,
        reason: result.detail?.[0]?.reason || "Unknown error",
      };
    }
  } catch (err) {
    console.error("J&T Order API Error:", err.message);
    return { success: false, reason: err.message };
  }
};

const trackJntShipment = async (awb) => {
  try {
    const url = process.env.JNT_TRACK_URL;
    const eccompanyid = process.env.JNT_USERNAME;
    const username = process.env.JNT_USERNAME;
    const password = process.env.JNT_PW_TRACK;

    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const requestBody = {
      awb,
      eccompanyid,
    };

    const response = await axios.post(url, JSON.stringify(requestBody), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("JNT Tracking Error:", error.response?.data || error.message);
    return {
      error: true,
      message:
        error.response?.data?.error_message ||
        "Failed to track shipment. Please try again later.",
    };
  }
};

module.exports = { getShippingCost, createJntOrder, trackJntShipment };
