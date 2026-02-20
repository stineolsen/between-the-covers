// Seed script to add a sample book for testing
// Run with: node seedBook.js

require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("./src/models/Book");
const User = require("./src/models/User");

const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0-7432-7356-5",
    description:
      "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, near New York City, the novel depicts first-person narrator Nick Carraway's interactions with mysterious millionaire Jay Gatsby and Gatsby's obsession to reunite with his former lover, Daisy Buchanan.",
    publishedYear: 1925,
    genres: ["Fiction", "Classic", "Romance"],
    pageCount: 180,
    publisher: "Charles Scribner's Sons",
    language: "English",
    status: "read",
    libraryLinks: {
      audiobook: "https://example.com/audiobook",
      ebook: "https://example.com/ebook",
    },
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0-06-112008-4",
    description:
      "To Kill a Mockingbird is a novel by the American author Harper Lee. It was published in 1960 and was instantly successful. In the United States, it is widely read in high schools and middle schools.",
    publishedYear: 1960,
    genres: ["Fiction", "Classic", "Historical Fiction"],
    pageCount: 324,
    publisher: "J. B. Lippincott & Co.",
    language: "English",
    status: "currently-reading",
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "978-0-452-28423-4",
    description:
      "Nineteen Eighty-Four (also published as 1984) is a dystopian social science fiction novel and cautionary tale by English writer George Orwell. It was published on 8 June 1949 by Secker & Warburg as Orwell's ninth and final book completed in his lifetime.",
    publishedYear: 1949,
    genres: ["Fiction", "Dystopian", "Science Fiction"],
    pageCount: 328,
    publisher: "Secker & Warburg",
    language: "English",
    status: "to-read",
  },
];

const seedBooks = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    // Find an admin user to assign as book creator
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("❌ No admin user found. Please create an admin user first.");
      process.exit(1);
    }

    // Check if books already exist
    const existingBooks = await Book.countDocuments();
    if (existingBooks > 0) {
      console.log(`ℹ️  Database already has ${existingBooks} books.`);
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question(
        "Do you want to add more sample books? (y/n): ",
        async (answer) => {
          readline.close();
          if (answer.toLowerCase() !== "y") {
            console.log("Seed cancelled.");
            process.exit(0);
          }
          await addBooks(admin);
        },
      );
    } else {
      await addBooks(admin);
    }
  } catch (error) {
    console.error("Error seeding books:", error.message);
    process.exit(1);
  }
};

const addBooks = async (admin) => {
  try {
    // Create sample books
    for (const bookData of sampleBooks) {
      const book = await Book.create({
        ...bookData,
        addedBy: admin._id,
      });
      console.log(`✅ Created book: ${book.title} by ${book.author}`);
    }

    console.log("");
    console.log(`🎉 Successfully added ${sampleBooks.length} sample books!`);
    console.log("");
    console.log("You can now:");
    console.log("  1. Visit http://localhost:5173/books to see the books");
    console.log("  2. Click on any book to see details");
    console.log("  3. As admin, you can edit or delete books");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("Error adding books:", error.message);
    process.exit(1);
  }
};

// Run the seed function
seedBooks();
