const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const uploadDir = path.resolve(__dirname, "..", "..", "uploads");
const maxImageSizeBytes = 5 * 1024 * 1024;
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function ensureUploadDir() {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

function buildStoredFileName(file) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const safeSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  return `meal-${safeSuffix}${extension}`;
}

function validateImageFile(req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
    return callback(new AppError(400, "VALIDATION_ERROR", "Invalid image format. Supported: jpg, jpeg, png, webp.", {
      field: "image",
      allowedTypes: ["jpg", "jpeg", "png", "webp"]
    }));
  }

  return callback(null, true);
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      ensureUploadDir();
      callback(null, uploadDir);
    },
    filename(req, file, callback) {
      callback(null, buildStoredFileName(file));
    }
  }),
  limits: {
    fileSize: maxImageSizeBytes
  },
  fileFilter: validateImageFile
});

function uploadMealImage(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(400, "VALIDATION_ERROR", "Image file must be 5 MB or smaller.", {
        field: "image",
        maxSizeMb: 5
      }));
    }

    if (error instanceof multer.MulterError) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid image upload.", {
        field: "image",
        reason: error.code
      }));
    }

    return next(error);
  });
}

module.exports = {
  uploadMealImage,
  maxImageSizeBytes
};
