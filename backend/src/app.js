const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userBookRoutes = require("./routes/userBookRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const productRoutes = require("./routes/productRoutes");
const shopRoutes = require("./routes/shopRoutes");
const activityRoutes = require("./routes/activityRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const bookRequestRoutes = require("./routes/bookRequestRoutes");
const importRoutes = require("./routes/importRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const listRoutes = require("./routes/listRoutes");
const commentRoutes = require("./routes/commentRoutes");
const listNotificationRoutes = require("./routes/listNotificationRoutes");
const authorRoutes = require("./routes/authorRoutes");
const seriesRoutes = require("./routes/seriesRoutes");
const pushRoutes = require("./routes/pushRoutes");
const wrappedRoutes = require("./routes/wrappedRoutes");
const adventRoutes = require("./routes/adventRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// CORS configuration
// Vercel preview deployments (one per branch) get their own subdomain, so a
// single FRONTEND_URL can't cover both production and whichever branch is
// being tested at once. Allow the configured production URL plus any Vercel
// preview URL for this project, so testing a branch never requires touching
// production's FRONTEND_URL.
const additionalOrigins = (process.env.ADDITIONAL_FRONTEND_URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173", ...additionalOrigins];
const vercelPreviewPattern = /^https:\/\/between-the-covers-git-[a-z0-9-]+-stine-s-projects\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser requests (curl, server-to-server, same-origin) send no
      // Origin header at all - always allow those.
      if (!origin || allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true, // Allow cookies to be sent
  }),
);

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user-books", userBookRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/book-requests", bookRequestRoutes);
app.use("/api/admin/import", importRoutes);
app.use("/api/admin/notifications", notificationRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/list-notifications", listNotificationRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/wrapped", wrappedRoutes);
app.use("/api/advent", adventRoutes);
app.use("/api/settings", settingsRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;
