const fs = require("fs");
const path = require("path");
const multer = require("multer");

jest.mock("fs"); // Harus paling atas dan sebelum require module manapun

describe("Middleware: upload.js", () => {
  let upload;

  // Helper untuk load ulang modul setelah mock aktif
  const loadUpload = () => {
    jest.resetModules(); // penting: reset cache require
    upload = require("../../middlewares/upload");
    return upload;
  };

  beforeEach(() => {
    jest.clearAllMocks(); // reset semua spy dan mock
  });

  it("should create upload directory if not exists", () => {
    fs.existsSync
      .mockReturnValueOnce(false) // untuk profile_pictures
      .mockReturnValueOnce(false); // untuk customs
    fs.mkdirSync.mockImplementation(() => {}); // dummy

    loadUpload(); // Baru require modul di sini

    console.log(fs.existsSync.mock.calls); // <== sekarang harus ada isinya
    console.log(fs.mkdirSync.mock.calls); // <== harus ada 2 pemanggilan

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining(path.join("uploads", "profile_pictures")),
      { recursive: true }
    );

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining(path.join("uploads", "customs")),
      { recursive: true }
    );
  });

  it("should not recreate folder if already exists", () => {
    fs.existsSync.mockReturnValue(true); // semua folder sudah ada

    loadUpload();

    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it("should call multer.diskStorage twice", () => {
    const spyDisk = jest.spyOn(multer, "diskStorage");
    fs.existsSync.mockReturnValue(true);

    loadUpload();

    expect(spyDisk).toHaveBeenCalledTimes(2);
  });

  it("should set correct destination and filename behavior", () => {
    fs.existsSync.mockReturnValue(true);
    const { uploadProfile } = loadUpload();

    const storage = uploadProfile.storage;

    const destCb = jest.fn();
    storage.getDestination({}, {}, destCb);

    expect(destCb).toHaveBeenCalledWith(
      null,
      expect.stringContaining(path.join("uploads", "profile_pictures"))
    );

    const file = { originalname: "avatar.jpg" };
    const fileCb = jest.fn();
    storage.getFilename({}, file, fileCb);
    const [[, filename]] = fileCb.mock.calls;

    expect(filename).toMatch(/^profile_\d+\.jpg$/);
  });

  it("should accept allowed file types", () => {
    const { fileFilter } = loadUpload();
    const cb = jest.fn();

    const file = { mimetype: "image/png" };
    fileFilter({}, file, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("should reject invalid file types", () => {
    const { fileFilter } = loadUpload();
    const cb = jest.fn();

    const file = { mimetype: "application/pdf" };
    fileFilter({}, file, cb);

    expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(cb.mock.calls[0][0].message).toBe(
      "Only .jpeg, .jpg, .png, .webp allowed"
    );
    expect(cb.mock.calls[0][1]).toBe(false);
  });

  it("should generate different storages for profile and product", () => {
    fs.existsSync.mockReturnValue(true);
    const { uploadProfile, uploadProduct } = loadUpload();

    expect(uploadProfile.storage).not.toBe(uploadProduct.storage);
  });
});
