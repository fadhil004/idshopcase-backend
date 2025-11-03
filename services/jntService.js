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

module.exports = { getShippingCost };
