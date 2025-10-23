// middlewares/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createStorage = (prefix) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join("uploads", `${prefix}_pictures`);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      // Gunakan path relatif agar sesuai ekspektasi test Jest
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}_${Date.now()}${ext}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

const uploadProfile = multer({
  storage: createStorage("profile"),
  fileFilter,
});

const uploadProduct = multer({
  storage: createStorage("product"),
  fileFilter,
});

module.exports = { uploadProfile, uploadProduct, createStorage, fileFilter };
