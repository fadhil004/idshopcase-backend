const orderController = require("../../controllers/orderController");
const {
  CartItem,
  Product,
  Order,
  OrderItem,
  Payment,
  Address,
} = require("../../models");
const jntService = require("../../services/jntService");
const dokuService = require("../../services/dokuService");

// Mock semua dependency
jest.mock("../../models", () => ({
  CartItem: { findAll: jest.fn() },
  Product: {},
  Order: { create: jest.fn(), findByPk: jest.fn() },
  OrderItem: { create: jest.fn() },
  Payment: { create: jest.fn() },
  Address: { findByPk: jest.fn() },
}));
jest.mock("../../services/jntService", () => ({
  getRate: jest.fn(),
  createOrder: jest.fn(),
  trackOrder: jest.fn(),
  cancelOrder: jest.fn(),
}));
jest.mock("../../services/dokuService", () => ({
  createCheckout: jest.fn(),
}));

// Mock response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("orderController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkout", () => {
    it("should create order successfully", async () => {
      const req = {
        user: { id: 1 },
        body: {
          addressId: 10,
          selectedItems: [1, 2],
          paymentMethod: "DOKU",
        },
      };
      const res = mockResponse();

      const mockAddress = { id: 10, district: "BDG" };
      Address.findByPk.mockResolvedValue(mockAddress);

      const mockCartItems = [
        {
          id: 1,
          productId: 5,
          price: 10000,
          quantity: 1,
          Product: { weight: 2 },
          destroy: jest.fn(),
        },
      ];
      CartItem.findAll.mockResolvedValue(mockCartItems);

      jntService.getRate.mockResolvedValue({ cost: 5000 });
      Order.create.mockResolvedValue({ id: 99 });
      OrderItem.create.mockResolvedValue({});
      Payment.create.mockResolvedValue({ id: 77 });
      dokuService.createCheckout.mockResolvedValue({
        payment_url: "http://pay.url",
      });

      await orderController.checkout(req, res);

      expect(Address.findByPk).toHaveBeenCalledWith(10);
      expect(CartItem.findAll).toHaveBeenCalled();
      expect(Order.create).toHaveBeenCalled();
      expect(Payment.create).toHaveBeenCalled();
      expect(dokuService.createCheckout).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Order created",
          paymentUrl: "http://pay.url",
        })
      );
    });

    it("should handle missing shippingRate cost and default to DOKU", async () => {
      const req = {
        user: { id: 1 },
        body: {
          addressId: 10,
          selectedItems: [1],
          // tidak ada paymentMethod untuk memicu default DOKU
        },
      };
      const res = mockResponse();

      const mockAddress = { id: 10, district: "BDG" };
      Address.findByPk.mockResolvedValue(mockAddress);

      const mockCartItems = [
        {
          id: 1,
          productId: 5,
          price: 20000,
          quantity: 1,
          Product: { weight: 1 },
          destroy: jest.fn(),
        },
      ];
      CartItem.findAll.mockResolvedValue(mockCartItems);

      jntService.getRate.mockResolvedValue({}); // cost hilang → fallback 0
      Order.create.mockResolvedValue({ id: 50 });
      OrderItem.create.mockResolvedValue({});
      Payment.create.mockResolvedValue({ id: 70 });
      dokuService.createCheckout.mockResolvedValue({
        payment_url: "http://doku.test",
      });

      await orderController.checkout(req, res);

      // Cek default DOKU terpakai
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method: "DOKU",
        })
      );

      // Cek fallback shipping cost 0
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingCost: 0,
          total: expect.any(Number),
        })
      );
    });

    it("should return 404 if address not found", async () => {
      const req = { user: { id: 1 }, body: { addressId: 1 } };
      const res = mockResponse();
      Address.findByPk.mockResolvedValue(null);

      await orderController.checkout(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Address not found" });
    });

    it("should return 400 if no selected items", async () => {
      const req = {
        user: { id: 1 },
        body: { addressId: 1, selectedItems: [] },
      };
      const res = mockResponse();

      Address.findByPk.mockResolvedValue({ id: 1 });
      CartItem.findAll.mockResolvedValue([]);

      await orderController.checkout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "No selected items" });
    });

    it("should return 500 on unexpected error", async () => {
      const req = { user: { id: 1 }, body: { addressId: 1 } };
      const res = mockResponse();
      Address.findByPk.mockRejectedValue(new Error("DB Error"));

      await orderController.checkout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
  });

  describe("paymentCallback", () => {
    it("should process successful payment", async () => {
      const req = {
        body: {
          orderId: 1,
          transactionStatus: "SUCCESS",
          transactionId: "trx123",
        },
      };
      const res = mockResponse();

      const order = {
        id: 1,
        status: "pending",
        Payment: { status: "pending", save: jest.fn() },
        Address: { id: 10 },
        save: jest.fn(),
      };

      Order.findByPk.mockResolvedValue(order);
      jntService.createOrder.mockResolvedValue({ awb_no: "JNT123" });

      await orderController.paymentCallback(req, res);

      expect(order.status).toBe("paid");
      expect(order.Payment.status).toBe("success");
      expect(order.tracking_number).toBe("JNT123");
      expect(res.json).toHaveBeenCalledWith({ message: "Callback processed" });
    });

    it("should skip update if transactionStatus is not SUCCESS", async () => {
      const req = {
        body: {
          orderId: 2,
          transactionStatus: "FAILED",
          transactionId: "trx999",
        },
      };
      const res = mockResponse();

      const order = {
        id: 2,
        status: "pending",
        Payment: { status: "pending", save: jest.fn() },
        Address: { id: 11 },
        save: jest.fn(),
      };

      Order.findByPk.mockResolvedValue(order);

      await orderController.paymentCallback(req, res);

      expect(order.status).toBe("pending");
      expect(order.Payment.status).toBe("pending");
      expect(jntService.createOrder).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: "Callback processed" });
    });

    it("should return 404 if order not found", async () => {
      const req = { body: { orderId: 999 } };
      const res = mockResponse();
      Order.findByPk.mockResolvedValue(null);

      await orderController.paymentCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
    });

    it("should return 500 if error occurs", async () => {
      const req = { body: { orderId: 1 } };
      const res = mockResponse();
      Order.findByPk.mockRejectedValue(new Error("Server crash"));

      await orderController.paymentCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server crash" });
    });
  });

  describe("trackOrder", () => {
    it("should return tracking info", async () => {
      const req = { params: { awb: "JNT123" } };
      const res = mockResponse();
      jntService.trackOrder.mockResolvedValue({ status: "Delivered" });

      await orderController.trackOrder(req, res);

      expect(jntService.trackOrder).toHaveBeenCalledWith("JNT123");
      expect(res.json).toHaveBeenCalledWith({ status: "Delivered" });
    });

    it("should return 500 if tracking fails", async () => {
      const req = { params: { awb: "ERR" } };
      const res = mockResponse();
      jntService.trackOrder.mockRejectedValue(new Error("Tracking failed"));

      await orderController.trackOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Tracking failed" });
    });
  });

  describe("cancelOrder", () => {
    it("should cancel order successfully", async () => {
      const req = { params: { orderId: 1 } };
      const res = mockResponse();

      const order = { id: 1, status: "pending", save: jest.fn() };
      Order.findByPk.mockResolvedValue(order);
      jntService.cancelOrder.mockResolvedValue({ success: true });

      await orderController.cancelOrder(req, res);

      expect(order.status).toBe("cancelled");
      expect(res.json).toHaveBeenCalledWith({
        message: "Order cancelled",
        cancel: { success: true },
      });
    });

    it("should not change status if cancel success is false", async () => {
      const req = { params: { orderId: 5 } };
      const res = mockResponse();
      const order = { id: 5, status: "pending", save: jest.fn() };
      Order.findByPk.mockResolvedValue(order);
      jntService.cancelOrder.mockResolvedValue({ success: false });

      await orderController.cancelOrder(req, res);

      expect(order.status).toBe("pending"); // tidak berubah
      expect(res.json).toHaveBeenCalledWith({
        message: "Order cancelled",
        cancel: { success: false },
      });
    });

    it("should return 404 if order not found", async () => {
      const req = { params: { orderId: 99 } };
      const res = mockResponse();
      Order.findByPk.mockResolvedValue(null);

      await orderController.cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
    });

    it("should handle server error", async () => {
      const req = { params: { orderId: 1 } };
      const res = mockResponse();
      Order.findByPk.mockRejectedValue(new Error("DB Error"));

      await orderController.cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
  });
});
