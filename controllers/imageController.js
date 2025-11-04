const path = require("path");
const fs = require("fs");

const getImageProduct = (req, res) => {
  const imageName = req.params.imageName;

  const imagePath = path.join(__dirname, "../uploads/products/", imageName);

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.sendFile(imagePath);
  });
};
const getImageCustom = (req, res) => {
  const imageName = req.params.imageName;

  const imagePath = path.join(__dirname, "../uploads/customs/", imageName);

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.sendFile(imagePath);
  });
};
const getImageProfilePicture = (req, res) => {
  const imageName = req.params.imageName;

  const imagePath = path.join(
    __dirname,
    "../uploads/profile_pictures/",
    imageName
  );

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.sendFile(imagePath);
  });
};

module.exports = { getImageProduct, getImageCustom, getImageProfilePicture };
