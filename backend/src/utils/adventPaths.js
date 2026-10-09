const path = require("path");

const UPLOADS_ROOT = path.join(__dirname, "../../uploads");
const BOOKS_UPLOAD_DIR = path.join(UPLOADS_ROOT, "books");

// Deliberately OUTSIDE backend/uploads - app.js serves that whole tree as
// plain static files (app.use("/uploads", express.static(...))), which
// would bypass adventController's per-user unlock check entirely. Advent
// images live in their own directory that nothing mounts statically, and
// are only ever read by adventController's gated route.
const ADVENT_IMAGE_ROOT = path.join(__dirname, "../../advent-images");

module.exports = { UPLOADS_ROOT, ADVENT_IMAGE_ROOT, BOOKS_UPLOAD_DIR };
