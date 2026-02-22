const Book = require("../models/Book");
const path = require("path");
const fs = require("fs");

// @desc    Get all books
// @route   GET /api/books
// @access  Private
exports.getBooks = async (req, res, next) => {
  try {
    const { search, bookclubOnly, audiobookOnly, genre, sort } = req.query;

    // Build query
    let query = {};

    // Search by title, author, or series only
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { author: regex },
        { series: regex },
      ];
    }

    // Filter by bookclub books only (books with bookclubMonth set)
    if (bookclubOnly === "true") {
      query.bookclubMonth = { $nin: [null, "", undefined] };
    }

    // Filter by audiobook availability
    if (audiobookOnly === "true") {
      query["libraryLinks.audiobook"] = { $nin: [null, "", undefined] };
    }

    // Filter by genre
    if (genre) {
      query.genres = genre;
    }

    // Sort options
    let sortOptions = {};
    switch (sort) {
      case "title":
        sortOptions = { title: 1 };
        break;
      case "author":
        sortOptions = { author: 1 };
        break;
      case "rating":
        sortOptions = { averageRating: -1 };
        break;
      case "newest":
        sortOptions = { dateAdded: -1 };
        break;
      default:
        sortOptions = { dateAdded: -1 };
    }

    const books = await Book.find(query)
      .sort(sortOptions)
      .populate("addedBy", "username displayName");

    res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all distinct genres used across books
// @route   GET /api/books/genres
// @access  Private
exports.getGenres = async (req, res, next) => {
  try {
    const genres = await Book.distinct('genres');
    res.status(200).json({ success: true, genres: genres.filter(Boolean).sort() });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Private
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      "addedBy",
      "username displayName",
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create book
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req, res, next) => {
  try {
    const {
      title,
      author,
      isbn,
      description,
      publishedYear,
      genres,
      pageCount,
      publisher,
      language,
      series,
      seriesNumber,
      bookclubMonth,
      libraryLinks,
      calibreId,
      calibreDownloadLink,
    } = req.body;

    // Handle cover image upload
    let coverImage = null;
    if (req.file) {
      // Store relative path from uploads directory
      coverImage = req.file.filename;
    }

    // Parse genres if it's a string
    let parsedGenres = genres;
    if (typeof genres === "string") {
      parsedGenres = genres.split(",").map((g) => g.trim());
    }

    // Parse library links if it's a string
    let parsedLibraryLinks = libraryLinks;
    if (typeof libraryLinks === "string") {
      try {
        parsedLibraryLinks = JSON.parse(libraryLinks);
      } catch (e) {
        parsedLibraryLinks = {};
      }
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      description,
      coverImage,
      publishedYear,
      genres: parsedGenres,
      pageCount,
      publisher,
      language,
      series: series || null,
      seriesNumber: seriesNumber || null,
      bookclubMonth: bookclubMonth || null,
      libraryLinks: parsedLibraryLinks || {},
      calibreId: calibreId || null,
      calibreDownloadLink: calibreDownloadLink || null,
      addedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      book,
    });
  } catch (error) {
    // If there was an error, delete uploaded file
    if (req.file) {
      const filePath = path.join(
        __dirname,
        "../../uploads/books",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private/Admin
exports.updateBook = async (req, res, next) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const {
      title,
      author,
      isbn,
      description,
      publishedYear,
      genres,
      pageCount,
      publisher,
      language,
      series,
      seriesNumber,
      bookclubMonth,
      libraryLinks,
      calibreId,
      calibreDownloadLink,
    } = req.body;

    // Handle new cover image upload
    if (req.file) {
      // Delete old cover image if it exists
      if (book.coverImage) {
        const oldImagePath = path.join(
          __dirname,
          "../../uploads/books",
          book.coverImage,
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      book.coverImage = req.file.filename;
    }

    // Update fields
    if (title) book.title = title;
    if (author) book.author = author;
    if (isbn !== undefined) book.isbn = isbn;
    if (description !== undefined) book.description = description;
    if (publishedYear) book.publishedYear = publishedYear;
    if (pageCount !== undefined) book.pageCount = pageCount;
    if (publisher !== undefined) book.publisher = publisher;
    if (language) book.language = language;
    if (series !== undefined) book.series = series || null;
    if (seriesNumber !== undefined) book.seriesNumber = seriesNumber || null;
    if (bookclubMonth !== undefined) book.bookclubMonth = bookclubMonth || null;
    if (calibreId !== undefined) book.calibreId = calibreId;
    if (calibreDownloadLink !== undefined)
      book.calibreDownloadLink = calibreDownloadLink;

    // Parse and update genres
    if (genres) {
      if (typeof genres === "string") {
        book.genres = genres.split(",").map((g) => g.trim());
      } else {
        book.genres = genres;
      }
    }

    // Parse and update library links
    if (libraryLinks) {
      if (typeof libraryLinks === "string") {
        try {
          book.libraryLinks = JSON.parse(libraryLinks);
        } catch (e) {
          // Keep existing if parse fails
        }
      } else {
        book.libraryLinks = libraryLinks;
      }
    }

    await book.save();

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    // If there was an error, delete uploaded file
    if (req.file) {
      const filePath = path.join(
        __dirname,
        "../../uploads/books",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Delete cover image if it exists
    if (book.coverImage) {
      const imagePath = path.join(
        __dirname,
        "../../uploads/books",
        book.coverImage,
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await book.deleteOne();

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get books by status (for reading history)
// @route   GET /api/books/status/:status
// @access  Private
exports.getBooksByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    if (!["to-read", "currently-reading", "read"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const books = await Book.find({ status })
      .sort({ dateFinished: -1, dateAdded: -1 })
      .populate("addedBy", "username displayName");

    res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload/Update book cover
// @route   POST /api/books/:id/cover
// @access  Private/Admin
exports.uploadCover = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      // Delete uploaded file if book not found
      if (req.file) {
        const filePath = path.join(
          __dirname,
          "../../uploads/books",
          req.file.filename,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    // Delete old cover image if it exists
    if (book.coverImage) {
      const oldImagePath = path.join(
        __dirname,
        "../../uploads/books",
        book.coverImage,
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    book.coverImage = req.file.filename;
    await book.save();

    res.status(200).json({
      success: true,
      message: "Cover image uploaded successfully",
      coverImage: book.coverImage,
    });
  } catch (error) {
    // If there was an error, delete uploaded file
    if (req.file) {
      const filePath = path.join(
        __dirname,
        "../../uploads/books",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};
