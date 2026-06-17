const multer = require("multer");
const path = require("path");

// Storage configuration (memory storage for buffer uploads to Cloudinary)
const storage = multer.memoryStorage();

// File filter (allow images only)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Only JPEG and PNG image files are allowed"));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter
});

module.exports = upload;
