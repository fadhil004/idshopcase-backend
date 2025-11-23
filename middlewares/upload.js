const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
  storage: createStorage("profile_picture"),
  fileFilter,
});

const uploadProduct = multer({
  storage: createStorage("product"),
  fileFilter,
});
const uploadCustoms = multer({
  storage: createStorage("custom"),
  fileFilter,
});

module.exports = {
  uploadProfile,
  uploadProduct,
  uploadCustoms,
  createStorage,
  fileFilter,
};
