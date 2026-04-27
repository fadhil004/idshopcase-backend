const multer = require("multer");
const path = require("path");
const fs = require("fs");

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|webp)$/i;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAGIC_BYTES = [
  { bytes: [0xff, 0xd8, 0xff] }, // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47] }, // PNG
  { bytes: [0x52, 0x49, 0x46, 0x46] }, // WebP (RIFF header)
];

/**
 * Verifikasi magic bytes dari file yang sudah tersimpan ke disk.
 * Baca 12 byte pertama — cukup untuk detect semua format gambar yang didukung.
 */
async function verifyMagicBytes(filePath) {
  let fd;
  try {
    const buffer = Buffer.alloc(12);
    fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 12, 0);

    return MAGIC_BYTES.some(({ bytes }) =>
      bytes.every((byte, i) => buffer[i] === byte),
    );
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        /* ignore */
      }
    }
  }
}

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

// Validasi tahap 1: ekstensi + MIME type dari header HTTP
const fileFilter = (req, file, cb) => {
  const extValid = ALLOWED_EXTENSIONS.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(
      new Error("Tipe file tidak didukung. Gunakan: JPEG, JPG, PNG, atau WEBP"),
    );
  }
};

/**
 * Middleware post-upload: validasi magic bytes semua file yang diupload.
 * Pasang SETELAH multer di route:
 *   router.post("/", authenticate, uploadProfile.single("foto"), validateUploadedFiles, handler)
 */
const validateUploadedFiles = async (req, res, next) => {
  const files = req.files
    ? Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat()
    : req.file
      ? [req.file]
      : [];

  if (files.length === 0) return next();

  const invalidFiles = [];

  for (const file of files) {
    const valid = await verifyMagicBytes(file.path);
    if (!valid) {
      invalidFiles.push(file.originalname);
      try {
        fs.unlinkSync(file.path);
      } catch {
        /* ignore */
      }
    }
  }

  if (invalidFiles.length > 0) {
    // Hapus sisa file yang valid agar tidak orphan
    for (const file of files) {
      if (!invalidFiles.includes(file.originalname)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          /* ignore */
        }
      }
    }
    return res.status(400).json({
      message:
        "File tidak valid. Pastikan file benar-benar gambar (JPEG, PNG, WebP).",
    });
  }

  next();
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
  limits: { fileSize: FILE_SIZE_LIMIT, files: 10 },
});

module.exports = {
  uploadProfile,
  uploadProduct,
  uploadCustoms,
  validateUploadedFiles,
  createStorage,
  fileFilter,
};
