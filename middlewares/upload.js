const multer = require("multer");
const path = require("path");
const fs = require("fs");

function makeStorage(folderName, prefix) {
  const uploadDir = path.join(__dirname, `../uploads/${folderName}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}_${Date.now()}${ext}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only .jpeg, .jpg, .png, .webp allowed"), false);
  }
  cb(null, true);
};

// khusus profile picture
const uploadProfile = multer({
  storage: makeStorage("profile_pictures", "profile"),
  fileFilter,
});

// khusus produk
const uploadProduct = multer({
  storage: makeStorage("customs", "custom"),
  fileFilter,
});

module.exports = { uploadProfile, uploadProduct };
