// services/jntService.js
const getShippingCost = async (address) => {
  let cost = 0;
  if (address.province.includes("Jakarta")) cost = 10000;
  else if (address.province.includes("Jawa")) cost = 15000;
  else cost = 25000;

  return { courier: "JNT", cost };
};

module.exports = { getShippingCost };
