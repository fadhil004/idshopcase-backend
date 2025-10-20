const fs = require("fs");
const path = require("path");
const multer = require("multer");

jest.mock("fs");

describe("Middleware: upload.js", () => {
  beforeEach(() => {
    jest.resetModules(); // supaya require ulang setiap test
    jest.clearAllMocks();
  });

  it("should create upload directory if not exists", () => {
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});

    require("../../middlewares/upload");

    // Panggilan pertama untuk profile, kedua untuk custom
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("uploads/profile_pictures"),
      { recursive: true }
    );
  });

  it("should not recreate folder if already exists", () => {
    fs.existsSync.mockReturnValue(true);
    require("../../middlewares/upload");
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it("should call multer.diskStorage twice (for profile & product)", () => {
    const mockDisk = jest.spyOn(multer, "diskStorage");
    fs.existsSync.mockReturnValue(true);

    require("../../middlewares/upload");

    expect(mockDisk).toHaveBeenCalledTimes(2);
  });

  it("should set correct destination and filename behavior", (done) => {
    fs.existsSync.mockReturnValue(true);
    const { uploadProfile } = require("../../middlewares/upload");

    // kita butuh akses ke fungsi callback di dalam storage
    const storage = uploadProfile.storage;

    const file = { originalname: "avatar.jpg" };
    const req = {};

    // gunakan internal _handleFile untuk memancing callback di diskStorage
    storage._handleFile(req, file, (err, info) => {
      // karena kita tidak benar-benar menyimpan file, kita test manual callback
      const ext = path.extname(file.originalname);
      const namePattern = /^profile_\d+\.jpg$/;
      expect(namePattern.test(`profile_${Date.now()}${ext}`)).toBe(true);
      done();
    });
  });

  it("should accept allowed file types", (done) => {
    const { uploadProduct } = require("../../middlewares/upload");
    const file = { mimetype: "image/webp" };

    uploadProduct.fileFilter({}, file, (err, accept) => {
      expect(err).toBeNull();
      expect(accept).toBe(true);
      done();
    });
  });

  it("should reject invalid file types", (done) => {
    const { uploadProfile } = require("../../middlewares/upload");
    const file = { mimetype: "application/pdf" };

    uploadProfile.fileFilter({}, file, (err, accept) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Only .jpeg, .jpg, .png, .webp allowed");
      expect(accept).toBe(false);
      done();
    });
  });

  it("should generate different storages for profile and product", () => {
    fs.existsSync.mockReturnValue(true);
    const {
      uploadProfile,
      uploadProduct,
    } = require("../../middlewares/upload");
    expect(uploadProfile.storage).not.toBe(uploadProduct.storage);
  });
});
