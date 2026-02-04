async function autoExpirePayment(order, payment) {
  if (
    payment.status === "pending" &&
    payment.expired_at &&
    new Date() > new Date(payment.expired_at)
  ) {
    await payment.update({ status: "expired" });
    await order.update({ status: "cancelled" });
  }
}

module.exports = autoExpirePayment;
