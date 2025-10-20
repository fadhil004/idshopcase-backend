const adminProductController = require("../../controllers/adminProductController");

// Mock dependencies
jest.mock("fs");
jest.mock("path");
jest.mock("../../models", () => ({
  Product: {
    findByPk: jest.fn(),
  },
  CustomImage: {
    findByPk: jest.fn(),
  },
}));

const fs = require("fs");
const path = require("path");
const { Product, CustomImage } = require("../../models");

describe("adminProductController", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      download: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("downloadCustomImage", () => {
    test("Berhasil download file", async () => {
      req.params.id = 1;
      const fakeImage = { id: 1, image_url: "/uploads/customs/test.jpg" };
      CustomImage.findByPk.mockResolvedValue(fakeImage);

      const fakePath = "/absolute/path/to/uploads/customs/test.jpg";
      path.join.mockReturnValue(fakePath);
      fs.existsSync.mockReturnValue(true);

      await adminProductController.downloadCustomImage(req, res);

      expect(CustomImage.findByPk).toHaveBeenCalledWith(1);
      expect(fs.existsSync).toHaveBeenCalledWith(fakePath);
      expect(res.download).toHaveBeenCalledWith(fakePath, path.basename(fakePath));
    });

    test("CustomImage tidak ditemukan di DB", async () => {
      req.params.id = 999;
      CustomImage.findByPk.mockResolvedValue(null);

      await adminProductController.downloadCustomImage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Custom image not found",
      });
    });

    test("File tidak ditemukan di sistem file", async () => {
      req.params.id = 2;
      const fakeImage = { id: 2, image_url: "/uploads/customs/missing.jpg" };
      CustomImage.findByPk.mockResolvedValue(fakeImage);

      const fakePath = "/absolute/path/to/uploads/customs/missing.jpg";
      path.join.mockReturnValue(fakePath);
      fs.existsSync.mockReturnValue(false);

      await adminProductController.downloadCustomImage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "File not found" });
    });

    test("Path.join menghasilkan error (simulasi exception internal)", async () => {
      req.params.id = 3;
      const fakeImage = { id: 3, image_url: "/uploads/customs/err.jpg" };
      CustomImage.findByPk.mockResolvedValue(fakeImage);

      // Simulasikan error di path.join
      path.join.mockImplementation(() => {
        throw new Error("path error");
      });

      await adminProductController.downloadCustomImage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "path error" });
    });

    test("Database error (reject Promise)", async () => {
      req.params.id = 4;
      CustomImage.findByPk.mockRejectedValue(new Error("DB connection failed"));

      await adminProductController.downloadCustomImage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "DB connection failed",
      });
    });
  });

  describe("updateProduct", () => {
    test("Berhasil update product (semua field berubah)", async () => {
      req.params.id = 1;
      req.body = {
        description: "New description",
        price: 150000,
        stock: 20,
      };

      const fakeProduct = {
        id: 1,
        description: "Old",
        price: 100000,
        stock: 10,
        save: jest.fn(),
      };

      Product.findByPk.mockResolvedValue(fakeProduct);

      await adminProductController.updateProduct(req, res);

      expect(Product.findByPk).toHaveBeenCalledWith(1);
      expect(fakeProduct.description).toBe("New description");
      expect(fakeProduct.price).toBe(150000);
      expect(fakeProduct.stock).toBe(20);
      expect(fakeProduct.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Product updated",
        product: fakeProduct,
      });
    });

    test("Hanya sebagian field diupdate (description saja)", async () => {
      req.params.id = 2;
      req.body = { description: "Partial update" };

      const fakeProduct = {
        id: 2,
        description: "Old desc",
        price: 50000,
        stock: 5,
        save: jest.fn(),
      };

      Product.findByPk.mockResolvedValue(fakeProduct);

      await adminProductController.updateProduct(req, res);

      expect(fakeProduct.description).toBe("Partial update");
      expect(fakeProduct.price).toBe(50000); // tetap sama
      expect(fakeProduct.stock).toBe(5); // tetap sama
      expect(res.json).toHaveBeenCalledWith({
        message: "Product updated",
        product: fakeProduct,
      });
    });

    test("Product tidak ditemukan", async () => {
      req.params.id = 999;
      Product.findByPk.mockResolvedValue(null);

      await adminProductController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product not found",
      });
    });

    test("Database error saat findByPk", async () => {
      req.params.id = 5;
      Product.findByPk.mockRejectedValue(new Error("DB crashed"));

      await adminProductController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB crashed" });
    });

    test("Error saat save() (gagal simpan ke DB)", async () => {
      req.params.id = 1;
      req.body = { price: 99999 };
      const fakeProduct = {
        id: 1,
        description: "desc",
        price: 10000,
        stock: 10,
        save: jest.fn().mockRejectedValue(new Error("Save failed")),
      };

      Product.findByPk.mockResolvedValue(fakeProduct);

      await adminProductController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Save failed" });
    });
  });
});
