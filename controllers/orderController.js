const {
  Cart,
  CartItem,
  CustomImage,
  Product,
  Address,
  Order,
  OrderItem,
  Payment,
  User,
  ProductImage,
  JntAddressMapping,
  PhoneType,
  Variant,
} = require("../models");
const getShippingCost = require("../services/getShippingCostCached");
const { trackJntShipment } = require("../services/jntService");
const { createDokuCheckout } = require("../services/dokuService");
const redis = require("../config/redis");
const crypto = require("crypto");

exports.getOrderSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, selectedItemIds, buyNow: buyNowRaw } = req.body;

    const buyNow = buyNowRaw ? JSON.parse(buyNowRaw) : null;

    const address = await Address.findByPk(addressId, {
      include: [{ model: JntAddressMapping, as: "JntMapping" }],
    });
    if (!address) return res.status(404).json({ message: "Address not found" });

    const jnt = address.JntMapping;
    if (!jnt)
      return res
        .status(400)
        .json({ message: "J&T mapping not found for this address" });

    let items = [];
    let subtotal = 0;
    let totalWeight = 0;
    if (buyNow) {
      const variant = await Variant.findByPk(buyNow.variantId);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      const price = parseFloat(variant.price);

      items.push({
        id: null,
        quantity: buyNow.quantity,
        price,
        subtotal: price * buyNow.quantity,
        variantId: variant.id,
      });

      subtotal = price * buyNow.quantity;
      totalWeight = 0.1 * buyNow.quantity;
    } else {
      if (!selectedItemIds || selectedItemIds.length === 0) {
        return res
          .status(400)
          .json({ message: "selectedItemIds required when not using buyNow" });
      }

      const cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            include: [{ model: Variant }],
            where: { id: selectedItemIds },
          },
        ],
      });

      if (!cart || cart.CartItems.length === 0)
        return res.status(400).json({ message: "No selected items found" });

      items = cart.CartItems.map((item) => {
        const price = parseFloat(item.Variant.price);
        return {
          id: item.id,
          quantity: item.quantity,
          price,
          subtotal: item.quantity * price,
          variantId: item.variantId,
        };
      });

      subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
      totalWeight = items.reduce((acc, item) => acc + 0.1 * item.quantity, 0);
    }

    const {
      cost: shippingCost,
      name: shippingService,
      error: shippingError,
    } = await getShippingCost({
      weight: totalWeight,
      sendSiteCode: "JAKARTA",
      destAreaCode: jnt.jnt_district,
    });

    if (shippingError) {
      throw new Error(`Failed to get shipping cost: ${shippingError}`);
    }

    return res.json({
      message: "Order summary calculated",
      data: {
        items,
        subtotal,
        shipping: {
          courier: "J&T Express",
          service: shippingService,
          cost: shippingCost,
        },
        total: subtotal + shippingCost,
        buyNow: !!buyNow,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get order summary",
      error: error.message,
    });
  }
};

exports.createOrder = async (req, res) => {
  const t = await Order.sequelize.transaction();
  try {
    const userId = req.user.id;
    const { addressId, selectedItemIds, buyNow: buyNowRaw } = req.body;

    const buyNow = buyNowRaw ? JSON.parse(buyNowRaw) : null;

    let selectedIds = null;

    if (selectedItemIds) {
      try {
        selectedIds = JSON.parse(selectedItemIds);
      } catch {
        return res
          .status(400)
          .json({ message: "Invalid selectedItemIds format" });
      }
    }

    let customMap = {};
    if (req.body.customMap) {
      try {
        customMap = JSON.parse(req.body.customMap);
      } catch {
        return res.status(400).json({ message: "Invalid customMap JSON" });
      }
    }

    const user = await User.findByPk(userId);
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    const address = await Address.findByPk(addressId, {
      include: [{ model: JntAddressMapping, as: "JntMapping" }],
    });

    if (!address) {
      await t.rollback();
      return res.status(404).json({ message: "Address not found" });
    }

    const customImageRecords = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const image = await CustomImage.create(
          {
            userId,
            image_url: `/uploads/customs/${file.filename}`,
            processed_url: null,
          },
          { transaction: t }
        );

        customImageRecords.push(image);
      }
    }

    let items = [];
    let subtotal = 0;
    let totalWeight = 0;

    if (buyNow) {
      const variant = await Variant.findByPk(buyNow.variantId);
      if (!variant) {
        await t.rollback();
        return res.status(404).json({ message: "Variant not found" });
      }

      const mappedFiles = customMap.buyNow || [];
      const imagesForItem = mappedFiles
        .map((i) => customImageRecords[i]?.id)
        .filter(Boolean);

      const price = parseFloat(variant.price);

      items.push({
        productId: variant.productId,
        quantity: buyNow.quantity,
        price,
        phoneTypeId: buyNow.phoneTypeId || null,
        variantId: variant.id,
        customImageId: imagesForItem,
      });

      subtotal = price * buyNow.quantity;
      totalWeight = 0.1 * buyNow.quantity;
    } else if (selectedIds) {
      const cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            include: [Variant],
            where: { id: selectedIds },
          },
        ],
      });

      if (!cart || cart.CartItems.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: "No cart items found" });
      }

      for (const item of cart.CartItems) {
        const price = parseFloat(item.Variant.price);

        const mappedFiles = customMap[item.id]?.files || [];
        const imagesForItem = mappedFiles
          .map((i) => customImageRecords[i]?.id)
          .filter(Boolean);

        items.push({
          productId: item.Variant.productId,
          quantity: item.quantity,
          price,
          phoneTypeId: item.phoneTypeId,
          variantId: item.variantId,
          customImageId: imagesForItem,
          cartItemInstance: item,
        });
      }

      subtotal = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      totalWeight = items.reduce((acc, item) => acc + 0.1 * item.quantity, 0);
    }

    const { cost: shippingCost, error: shippingError } = await getShippingCost({
      weight: totalWeight,
      sendSiteCode: "JAKARTA",
      destAreaCode: address.JntMapping.jnt_district,
    });

    if (shippingError) throw new Error(shippingError);

    const totalPrice = subtotal + shippingCost;
    const requestId = crypto.randomUUID();

    const order = await Order.create(
      {
        userId,
        addressId,
        total_price: totalPrice,
        payment_method: "DOKU Checkout",
        status: "pending",
        requestId,
      },
      { transaction: t }
    );

    for (const item of items) {
      const orderItem = await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          phoneTypeId: item.phoneTypeId,
          variantId: item.variantId,
        },
        { transaction: t }
      );

      if (item.customImageId.length > 0) {
        await orderItem.addCustomImage(item.customImageId, { transaction: t });
      }

      if (item.cartItemInstance)
        await item.cartItemInstance.destroy({ transaction: t });
    }

    const payment = await Payment.create(
      {
        orderId: order.id,
        payment_gateway: "DOKU",
        amount: totalPrice,
        status: "pending",
      },
      { transaction: t }
    );

    const checkout = await createDokuCheckout(order, user, requestId);

    await t.commit();

    return res.status(201).json({
      message: "Order created successfully",
      order,
      items,
      images: customImageRecords,
      payment,
      checkout,
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `orders:user:${userId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        message: "Orders retrieved (cache)",
        orders: JSON.parse(cached),
      });
    }

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name"],
              include: [
                {
                  model: ProductImage,
                  attributes: ["id", "imageUrl", "isPrimary"],
                },
              ],
            },
            {
              model: CustomImage,
              through: { attributes: [] }, // hilangkan kolom pivot
            },
            { model: PhoneType },
            { model: Variant },
          ],
        },
        { model: Payment },
        { model: Address },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    await redis.setex(cacheKey, 20, JSON.stringify(orders));

    return res.json({
      message: "Orders retrieved",
      orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cacheKey = `order:user:${userId}:${id}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json({
        message: "Order detail retrieved (cache)",
        order: JSON.parse(cached),
      });
    }

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name"],
              include: [{ model: ProductImage }],
            },
            {
              model: CustomImage,
              through: { attributes: [] }, // hilangkan kolom pivot
            },
            { model: PhoneType },
            { model: Variant },
          ],
        },
        { model: Payment },
        { model: Address },
      ],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    await redis.setex(cacheKey, 20, JSON.stringify(order));

    return res.json({ message: "Order detail retrieved", order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get order detail" });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.tracking_number) {
      return res
        .status(400)
        .json({ message: "Order does not have waybill yet" });
    }

    const trackingData = await trackJntShipment(order.tracking_number);

    if (trackingData.error_id) {
      return res.status(400).json({
        message: trackingData.error_message || "Failed to get tracking data",
      });
    }

    return res.json({
      message: "Tracking data retrieved successfully",
      tracking: trackingData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to track order",
      error: error.message,
    });
  }
};

exports.getAllOrdersByAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const cacheKey = `admin:orders:${status || "all"}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        message: "Admin order list retrieved (cache)",
        orders: JSON.parse(cached),
        count: JSON.parse(cached).length,
      });
    }

    const whereCondition = {};
    if (status) whereCondition.status = status;

    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "phone",
            "profile_picture",
            "role",
          ],
        },
        {
          model: OrderItem,
          include: [
            { model: Product, include: [ProductImage] },
            {
              model: CustomImage,
              through: { attributes: [] }, // hilangkan kolom pivot
            },
            PhoneType,
            Variant,
          ],
        },
        Payment,
        Address,
      ],
      order: [["createdAt", "DESC"]],
    });

    await redis.setex(cacheKey, 10, JSON.stringify(orders));

    return res.json({
      message: "Admin order list retrieved",
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve admin order list",
      error: error.message,
    });
  }
};

exports.getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `admin:order:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        message: "Order detail (admin) retrieved (cache)",
        order: JSON.parse(cached),
      });
    }

    const order = await Order.findOne({
      where: { id },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "phone",
            "profile_picture",
            "role",
          ],
        },
        {
          model: OrderItem,
          include: [
            { model: Product, include: [ProductImage] },
            {
              model: CustomImage,
              through: { attributes: [] }, // hilangkan kolom pivot
            },
            PhoneType,
            Variant,
          ],
        },
        Payment,
        Address,
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await redis.setex(cacheKey, 20, JSON.stringify(order));

    return res.json({
      message: "Order detail (admin) retrieved",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve order detail",
      error: error.message,
    });
  }
};
