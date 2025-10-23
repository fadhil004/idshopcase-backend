const fs = require("fs");
const path = require("path");
const multer = require("multer");

jest.mock("fs");

const { createStorage } = require("../../middlewares/upload");

describe("middlewares/upload.js", () => {
  let upload;

  beforeEach(() => {
    jest.clearAllMocks();
    upload = require("../../middlewares/upload");
  });

  test("should create directory if not exists when calling createStorage", () => {
    fs.existsSync.mockReturnValue(false);

    const storage = createStorage("profile");

    const req = {};
    const file = { originalname: "test.png" };
    const cb = jest.fn();

    storage._handleDestination
      ? storage._handleDestination(req, file, cb)
      : storage.getDestination
      ? storage.getDestination(req, file, cb)
      : storage.destination(req, file, cb);

    const expectedDir = path.join("uploads", "profile_pictures");

    expect(fs.existsSync).toHaveBeenCalledWith(expectedDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedDir, { recursive: true });

    expect(cb).toHaveBeenCalledWith(null, expectedDir);
  });

  test("should not recreate folder if already exists", () => {
    fs.existsSync.mockReturnValue(true);
    const { createStorage } = upload;

    const storage = createStorage("profile");
    const destCb = jest.fn();

    storage.getDestination({}, { originalname: "a.png" }, destCb);
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  test("should call destination and filename callbacks correctly", () => {
    fs.existsSync.mockReturnValue(true);
    const { createStorage } = upload;
    const storage = createStorage("profile");

    const destCb = jest.fn();
    const fileCb = jest.fn();
    const fakeFile = { originalname: "avatar.jpg" };

    storage.getDestination({}, fakeFile, destCb);
    storage.getFilename({}, fakeFile, fileCb);

    expect(destCb).toHaveBeenCalledWith(
      null,
      expect.stringMatching(/uploads[\\/]+profile_pictures/)
    );

    const calledName = fileCb.mock.calls[0][1];
    expect(calledName).toMatch(/^profile_\d+\.jpg$/);
  });

  test("should accept valid mimetypes", () => {
    const { uploadProfile } = upload;
    const cb = jest.fn();
    const validFile = { mimetype: "image/png", originalname: "test.png" };

    uploadProfile.fileFilter({}, validFile, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test("should reject invalid mimetypes", () => {
    const { uploadProduct } = upload;
    const cb = jest.fn();
    const invalidFile = {
      mimetype: "application/pdf",
      originalname: "file.pdf",
    };

    uploadProduct.fileFilter({}, invalidFile, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error));
    expect(cb.mock.calls[0][0].message).toBe("Invalid file type");
  });

  test("should produce different storage instances for profile and product", () => {
    const { uploadProfile, uploadProduct } = upload;
    expect(uploadProfile.storage).not.toBe(uploadProduct.storage);
  });

  test("should call multer with correct configuration", () => {
    const spy = jest.spyOn(multer, "diskStorage");
    const { createStorage } = upload;

    createStorage("custom");
    expect(spy).toHaveBeenCalled();
  });
});
