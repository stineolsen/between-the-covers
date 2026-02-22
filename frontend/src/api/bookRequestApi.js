import api from './axiosConfig';

const bookRequestApi = {
  create: async (title, author, formats) => {
    const response = await api.post('/api/book-requests', { title, author, formats });
    return response.data;
  },

  getMine: async () => {
    const response = await api.get('/api/book-requests/mine');
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/api/book-requests');
    return response.data;
  },

  markAsAdded: async (id) => {
    const response = await api.patch(`/api/book-requests/${id}/added`);
    return response.data;
  }
};

export default bookRequestApi;
