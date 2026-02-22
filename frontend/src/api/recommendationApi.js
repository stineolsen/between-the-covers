import api from './axiosConfig';

const recommendationApi = {
  create: async (bookId, recipientIds, message = '') => {
    const response = await api.post('/api/recommendations', { bookId, recipientIds, message });
    return response.data;
  },

  getMine: async () => {
    const response = await api.get('/api/recommendations/mine');
    return response.data;
  },

  dismiss: async (id) => {
    const response = await api.patch(`/api/recommendations/${id}/dismiss`);
    return response.data;
  }
};

export default recommendationApi;
