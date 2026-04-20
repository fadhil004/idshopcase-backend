const multer = require("multer");
const path = require("path");
const fs = require("fs");

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = /jpeg|jpg|png|webp/;

const createStorage = (prefix) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join("uploads", `${prefix}s`);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefix}_${Date.now()}${ext}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const extname = ALLOWED_TYPES.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = ALLOWED_TYPES.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error("Tipe file tidak didukung. Gunakan: JPEG, JPG, PNG, atau WEBP"),
    );
  }
};

const uploadProfile = multer({
  storage: createStorage("profile_picture"),
  fileFilter,
  limits: { fileSize: FILE_SIZE_LIMIT },
});

const uploadProduct = multer({
  storage: createStorage("product"),
  fileFilter,
  limits: { fileSize: FILE_SIZE_LIMIT },
});

const uploadCustoms = multer({
  storage: createStorage("custom"),
  fileFilter,
  limits: { fileSize: FILE_SIZE_LIMIT, files: 10 }, // max 10 file custom per order
});

module.exports = {
  uploadProfile,
  uploadProduct,
  uploadCustoms,
  createStorage,
  fileFilter,
};
