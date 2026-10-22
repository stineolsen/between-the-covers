import api from './axiosConfig';

const activityApi = {
  getActivity: async (limit = 25) => {
    const response = await api.get(`/api/activity?limit=${limit}`);
    return response.data;
  },

  toggleReaction: async (type, id, emoji) => {
    const response = await api.post(`/api/activity/${type}/${id}/reactions`, { emoji });
    return response.data;
  },

  getComments: async (type, id) => {
    const response = await api.get(`/api/activity/${type}/${id}/comments`);
    return response.data;
  },

  addComment: async (type, id, content) => {
    const response = await api.post(`/api/activity/${type}/${id}/comments`, { content });
    return response.data;
  },

  updateComment: async (commentId, content) => {
    const response = await api.put(`/api/activity/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/api/activity/comments/${commentId}`);
    return response.data;
  },
};

export default activityApi;
