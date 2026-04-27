const path = require("path");
const fs = require("fs");

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const sendImage = (folder) => (req, res) => {
  try {
    const imageName = path.basename(req.params.imageName);

    // Validasi ekstensi — tolak file non-gambar meski ada di folder uploads
    const ext = path.extname(imageName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    const imagePath = path.join(__dirname, `../uploads/${folder}/`, imageName);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.setHeader("Cache-Control", "public, max-age=86400");

    return res.sendFile(imagePath);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getImageProduct: sendImage("products"),
  getImageCustom: sendImage("customs"),
  getImageProfilePicture: sendImage("profile_pictures"),
};
