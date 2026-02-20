import api from "./axiosConfig";

export const reviewsApi = {
  // Get all reviews with optional filters
  getReviews: async (params = {}) => {
    const response = await api.get("/api/reviews", { params });
    return response.data;
  },

  // Get single review
  getReview: async (id) => {
    const response = await api.get(`/api/reviews/${id}`);
    return response.data;
  },

  // Get user's review for a specific book
  getUserReviewForBook: async (bookId) => {
    try {
      const response = await api.get(`/api/reviews/book/${bookId}/user`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, review: null };
      }
      throw error;
    }
  },

  // Create review
  createReview: async (reviewData) => {
    const response = await api.post("/api/reviews", reviewData);
    return response.data;
  },

  // Update review
  updateReview: async (id, reviewData) => {
    const response = await api.put(`/api/reviews/${id}`, reviewData);
    return response.data;
  },

  // Delete review
  deleteReview: async (id) => {
    const response = await api.delete(`/api/reviews/${id}`);
    return response.data;
  },

  // Toggle like on review
  toggleLike: async (id) => {
    const response = await api.post(`/api/reviews/${id}/like`);
    return response.data;
  },
};

export default reviewsApi;
