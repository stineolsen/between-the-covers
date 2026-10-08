const multer = require("multer");

// Memory storage, not disk: the raw upload only ever needs to pass through
// sharp (see adventImagePipeline.js) and is never written anywhere on its
// own - writing it to disk first, even briefly, risks it landing somewhere
// reachable before it's been through the pipeline.
const adventImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Ugyldig bildeformat - bruk JPEG, PNG eller WebP"));
    }
  },
});

module.exports = { adventImageUpload };
