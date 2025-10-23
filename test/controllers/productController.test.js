const productController = require("../../controllers/productController");
const { Product, CustomImage } = require("../../models");

jest.mock("../../models", () => require("../../mocks/models/index.js"));

// Mock Express res object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("productController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProducts", () => {
    //Berhasil menampilkan semua produk
    it("should return all products successfully", async () => {
      const req = {};
      const res = mockResponse();
      const mockProducts = [{ id: 1, name: "Phone Case" }];

      Product.findAll.mockResolvedValue(mockProducts);

      await productController.getProducts(req, res);

      expect(Product.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    //Gagal menampilkan produk (DB error)
    it("should handle internal server error", async () => {
      const req = {};
      const res = mockResponse();
      Product.findAll.mockRejectedValue(new Error("DB error"));

      await productController.getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });
  });

  describe("getProductById", () => {
    //Berhasil menemukan produk berdasarkan ID
    it("should return product when found", async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();
      const mockProduct = { id: 1, name: "Case" };

      Product.findByPk.mockResolvedValue(mockProduct);

      await productController.getProductById(req, res);

      expect(Product.findByPk).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    //Produk tidak ditemukan
    it("should return 404 if product not found", async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      Product.findByPk.mockResolvedValue(null);

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Product not found" });
    });

    //Error internal (DB gagal)
    it("should handle internal error", async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      Product.findByPk.mockRejectedValue(new Error("DB fail"));

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB fail" });
    });
  });

  describe("uploadCustomImage", () => {
    //Berhasil upload custom image
    it("should upload custom images successfully", async () => {
      const req = {
        body: { productId: 1 },
        user: { id: 5 },
        files: [{ filename: "img1.png" }, { filename: "img2.png" }],
      };
      const res = mockResponse();

      const mockProduct = { id: 1, category: "custom_case" };
      Product.findByPk.mockResolvedValue(mockProduct);

      CustomImage.create.mockImplementation(({ image_url }) => Promise.resolve({ id: Math.random(), image_url }));

      await productController.uploadCustomImage(req, res);

      expect(Product.findByPk).toHaveBeenCalledWith(1);
      expect(CustomImage.create).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Custom images uploaded. Processed URL will be updated later.",
          images: expect.any(Array),
        })
      );
    });

    //Produk tidak valid untuk custom image
    it("should return 400 if product not found or invalid category", async () => {
      const req = {
        body: { productId: 99 },
        user: { id: 1 },
        files: [{ filename: "x.png" }],
      };
      const res = mockResponse();

      Product.findByPk.mockResolvedValue({ id: 99, category: "keychain" });

      await productController.uploadCustomImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid product for custom image",
      });
    });

    //Tidak ada file diupload
    it("should return 400 if no files uploaded", async () => {
      const req = {
        body: { productId: 1 },
        user: { id: 1 },
        files: [],
      };
      const res = mockResponse();

      Product.findByPk.mockResolvedValue({ id: 1, category: "custom_case" });

      await productController.uploadCustomImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "No files uploaded",
      });
    });

    //Upload lebih dari 2 file (tidak diperbolehkan)
    it("should return 400 if more than 2 files uploaded", async () => {
      const req = {
        body: { productId: 1 },
        user: { id: 1 },
        files: [{ filename: "1.png" }, { filename: "2.png" }, { filename: "3.png" }],
      };
      const res = mockResponse();

      Product.findByPk.mockResolvedValue({ id: 1, category: "custom_case" });

      await productController.uploadCustomImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Maximum 2 images allowed",
      });
    });

    //Gagal karena error database
    it("should handle internal server error", async () => {
      const req = {
        body: { productId: 1 },
        user: { id: 1 },
        files: [{ filename: "a.png" }],
      };
      const res = mockResponse();

      Product.findByPk.mockRejectedValue(new Error("DB error"));

      await productController.uploadCustomImage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });
  });
});
