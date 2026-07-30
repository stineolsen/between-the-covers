import api from "./axiosConfig";

const commentsApi = {
  getComments: async ({ listId, bookId }) => {
    const params = { listId };
    if (bookId) params.bookId = bookId;
    const response = await api.get("/api/comments", { params });
    return response.data;
  },

  createComment: async ({ listId, bookId, content }) => {
    const response = await api.post("/api/comments", { listId, bookId, content });
    return response.data;
  },

  updateComment: async (id, content) => {
    const response = await api.put(`/api/comments/${id}`, { content });
    return response.data;
  },

  deleteComment: async (id) => {
    const response = await api.delete(`/api/comments/${id}`);
    return response.data;
  },
};

export default commentsApi;
