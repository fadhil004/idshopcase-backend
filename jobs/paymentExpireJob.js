const cron = require("node-cron");
const { Payment, Order } = require("../models");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  const expiredPayments = await Payment.findAll({
    where: {
      status: "pending",
      expired_at: { [require("sequelize").Op.lt]: now },
    },
  });

  for (const payment of expiredPayments) {
    await payment.update({ status: "expired" });
    await Order.update(
      { status: "cancelled" },
      { where: { id: payment.orderId } },
    );
  }

  console.log(`[CRON] Expired payments processed: ${expiredPayments.length}`);
});
