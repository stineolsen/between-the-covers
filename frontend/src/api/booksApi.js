import api from "./axiosConfig";

export const booksApi = {
  // Get all books with optional filters
  getBooks: async (params = {}) => {
    const response = await api.get("/api/books", { params });
    return response.data;
  },

  // Get single book by ID
  getBook: async (id) => {
    const response = await api.get(`/api/books/${id}`);
    return response.data;
  },

  // Get books by status (for reading history)
  getBooksByStatus: async (status) => {
    const response = await api.get(`/api/books/status/${status}`);
    return response.data;
  },

  // Create new book (admin only)
  createBook: async (bookData) => {
    const formData = new FormData();

    // Append all book fields
    Object.keys(bookData).forEach((key) => {
      if (key === "genres" && Array.isArray(bookData[key])) {
        formData.append(key, bookData[key].join(","));
      } else if (key === "libraryLinks") {
        formData.append(key, JSON.stringify(bookData[key]));
      } else if (bookData[key] !== null && bookData[key] !== undefined) {
        formData.append(key, bookData[key]);
      }
    });

    const response = await api.post("/api/books", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update book (admin only)
  updateBook: async (id, bookData) => {
    const formData = new FormData();

    // Append all book fields
    Object.keys(bookData).forEach((key) => {
      if (key === "genres" && Array.isArray(bookData[key])) {
        formData.append(key, bookData[key].join(","));
      } else if (key === "libraryLinks") {
        formData.append(key, JSON.stringify(bookData[key]));
      } else if (bookData[key] !== null && bookData[key] !== undefined) {
        formData.append(key, bookData[key]);
      }
    });

    const response = await api.put(`/api/books/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete book (admin only)
  deleteBook: async (id) => {
    const response = await api.delete(`/api/books/${id}`);
    return response.data;
  },

  // Upload/update book cover (admin only)
  uploadCover: async (id, coverImageFile) => {
    const formData = new FormData();
    formData.append("coverImage", coverImageFile);

    const response = await api.post(`/api/books/${id}/cover`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get all distinct genres from the library
  getGenres: async () => {
    const response = await api.get('/api/books/genres');
    return response.data;
  },

  // Helper: Get cover image URL
  getCoverUrl: (coverImage) => {
    if (!coverImage) return null;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${apiUrl}/uploads/books/${coverImage}`;
  },
};

export default booksApi;
