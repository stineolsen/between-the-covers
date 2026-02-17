import api from './axiosConfig';

export const userBooksApi = {
  // Get all user's books (optionally filtered by status)
  getUserBooks: async (params = {}) => {
    const response = await api.get('/api/user-books', { params });
    return response.data;
  },

  // Get user's status for a specific book
  getUserBookStatus: async (bookId) => {
    try {
      const response = await api.get(`/api/user-books/book/${bookId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, userBook: null };
      }
      throw error;
    }
  },

  // Set/update reading status for a book
  setBookStatus: async (bookId, status, notes = '') => {
    const response = await api.post('/api/user-books', {
      bookId,
      status,
      notes
    });
    return response.data;
  },

  // Remove book from user's list
  removeUserBook: async (id) => {
    const response = await api.delete(`/api/user-books/${id}`);
    return response.data;
  },

  // Get reading statistics
  getReadingStats: async () => {
    const response = await api.get('/api/user-books/stats');
    return response.data;
  }
};

export default userBooksApi;
