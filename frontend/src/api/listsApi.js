import api from "./axiosConfig";

const listsApi = {
  // Browse public lists
  getLists: async (params = {}) => {
    const response = await api.get("/api/lists", { params });
    return response.data;
  },

  // Lists the logged-in user owns or collaborates on
  getMyLists: async () => {
    const response = await api.get("/api/lists/mine");
    return response.data;
  },

  getList: async (id) => {
    const response = await api.get(`/api/lists/${id}`);
    return response.data;
  },

  createList: async (data) => {
    const response = await api.post("/api/lists", data);
    return response.data;
  },

  updateList: async (id, data) => {
    const response = await api.put(`/api/lists/${id}`, data);
    return response.data;
  },

  deleteList: async (id) => {
    const response = await api.delete(`/api/lists/${id}`);
    return response.data;
  },

  addBook: async (listId, bookId) => {
    const response = await api.post(`/api/lists/${listId}/books`, { bookId });
    return response.data;
  },

  removeBook: async (listId, bookId) => {
    const response = await api.delete(`/api/lists/${listId}/books/${bookId}`);
    return response.data;
  },

  reorderBooks: async (listId, orderedBookIds) => {
    const response = await api.patch(`/api/lists/${listId}/books/reorder`, { orderedBookIds });
    return response.data;
  },

  addCollaborators: async (listId, userIds, message = "") => {
    const response = await api.post(`/api/lists/${listId}/collaborators`, { userIds, message });
    return response.data;
  },

  removeCollaborator: async (listId, userId) => {
    const response = await api.delete(`/api/lists/${listId}/collaborators/${userId}`);
    return response.data;
  },
};

export default listsApi;
