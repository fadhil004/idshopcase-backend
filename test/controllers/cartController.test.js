const cartController = require("../../controllers/cartController");
const { Cart, CartItem, Product, CustomImage } = require("../../models");

jest.mock("../../models", () => ({
  Cart: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
  },
  CartItem: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Product: {
    findByPk: jest.fn(),
  },
  CustomImage: {},
}));

describe("CartController", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { id: 1 }, body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getCart", () => {
    it("should return cart if found", async () => {
      const mockCart = { id: 1, items: [] };
      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.getCart(req, res);

      expect(Cart.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: [{ model: CartItem, include: [Product, CustomImage] }],
      });
      expect(res.json).toHaveBeenCalledWith(mockCart);
    });

    it("should return 404 if cart not found", async () => {
      Cart.findOne.mockResolvedValue(null);

      await cartController.getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Cart not found" });
    });

    it("should handle errors", async () => {
      const error = new Error("DB failed");
      Cart.findOne.mockRejectedValue(error);

      await cartController.getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB failed" });
    });
  });

  describe("addToCart", () => {
    it("should add item to cart if no existing item", async () => {
      req.body = { productId: 1, customImageId: null, quantity: 2 };

      Product.findByPk.mockResolvedValue({ id: 1, price: 100 });
      Cart.findOrCreate.mockResolvedValue([{ id: 1 }]);
      CartItem.findOne.mockResolvedValue(null);
      CartItem.create.mockResolvedValue({ id: 10 });

      await cartController.addToCart(req, res);

      expect(CartItem.create).toHaveBeenCalledWith({
        cartId: 1,
        productId: 1,
        customImageId: null,
        quantity: 2,
        price: 200,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Item added to cart",
        item: { id: 10 },
      });
    });

    it("should update quantity if item already exists", async () => {
      req.body = { productId: 1, customImageId: null, quantity: 2 };

      const mockProduct = { id: 1, price: 100 };
      const mockItem = {
        id: 99,
        quantity: 1,
        Product: { price: 100 },
        save: jest.fn(),
      };

      Product.findByPk.mockResolvedValue(mockProduct);
      Cart.findOrCreate.mockResolvedValue([{ id: 1 }]);
      CartItem.findOne.mockResolvedValue(mockItem);

      await cartController.addToCart(req, res);

      expect(mockItem.quantity).toBe(3);
      expect(mockItem.price).toBe(300);
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Cart item updated",
        item: mockItem,
      });
    });

    it("should return 404 if product not found", async () => {
      Product.findByPk.mockResolvedValue(null);

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Product not found" });
    });

    it("should handle errors", async () => {
      const error = new Error("Unexpected crash");
      Product.findByPk.mockRejectedValue(error);

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Unexpected crash" });
    });
  });

  describe("updateCartItem", () => {
    it("should update item if found", async () => {
      req.params = { id: 1 };
      req.body = { quantity: 3 };
      const mockItem = {
        id: 1,
        quantity: 1,
        Product: { price: 50 },
        save: jest.fn(),
      };
      CartItem.findByPk.mockResolvedValue(mockItem);

      await cartController.updateCartItem(req, res);

      expect(mockItem.quantity).toBe(3);
      expect(mockItem.price).toBe(150);
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Cart item updated",
        item: mockItem,
      });
    });

    it("should return 404 if item not found", async () => {
      CartItem.findByPk.mockResolvedValue(null);

      await cartController.updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Cart item not found" });
    });

    it("should handle errors", async () => {
      const error = new Error("DB crashed");
      CartItem.findByPk.mockRejectedValue(error);

      await cartController.updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB crashed" });
    });
  });

  describe("removeCartItem", () => {
    it("should remove item if found", async () => {
      req.params = { id: 1 };
      const mockItem = { destroy: jest.fn() };
      CartItem.findByPk.mockResolvedValue(mockItem);

      await cartController.removeCartItem(req, res);

      expect(mockItem.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Item removed from cart",
      });
    });

    it("should return 404 if item not found", async () => {
      CartItem.findByPk.mockResolvedValue(null);

      await cartController.removeCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Cart item not found" });
    });

    it("should handle errors", async () => {
      const error = new Error("DB crashed");
      CartItem.findByPk.mockRejectedValue(error);

      await cartController.removeCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB crashed" });
    });
  });
});
