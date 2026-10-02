import api from "./axiosConfig";

export const wrappedApi = {
  getOverview: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/overview`);
    return response.data;
  },

  confirmBooks: async (year, excludedBookIds) => {
    const response = await api.put(`/api/wrapped/${year}/confirm-books`, { excludedBookIds });
    return response.data;
  },

  getRankingList: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/ranking-list`);
    return response.data;
  },

  markRankingDone: async (year) => {
    const response = await api.put(`/api/wrapped/${year}/ranking-done`);
    return response.data;
  },

  getQuestions: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/questions`);
    return response.data;
  },

  getBookclubBooks: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/bookclub-books`);
    return response.data;
  },

  saveAwards: async (year, answers) => {
    const response = await api.put(`/api/wrapped/${year}/awards`, { answers });
    return response.data;
  },

  submit: async (year) => {
    const response = await api.post(`/api/wrapped/${year}/submit`);
    return response.data;
  },

  getStatus: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/status`);
    return response.data;
  },

  // Admin only
  getAdminWindow: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/admin/window`);
    return response.data;
  },

  updateAdminWindow: async (year, { start, end }) => {
    const response = await api.put(`/api/wrapped/${year}/admin/window`, { start, end });
    return response.data;
  },

  getAdminTally: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/admin/tally`);
    return response.data;
  },

  getAdminQuestions: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/admin/questions`);
    return response.data;
  },

  createQuestion: async (year, { label, type, helper }) => {
    const response = await api.post(`/api/wrapped/${year}/admin/questions`, { label, type, helper });
    return response.data;
  },

  updateQuestion: async (year, id, data) => {
    const response = await api.put(`/api/wrapped/${year}/admin/questions/${id}`, data);
    return response.data;
  },

  deleteQuestion: async (year, id) => {
    const response = await api.delete(`/api/wrapped/${year}/admin/questions/${id}`);
    return response.data;
  },

  reorderQuestions: async (year, orderedQuestionIds) => {
    const response = await api.put(`/api/wrapped/${year}/admin/questions/reorder`, {
      orderedQuestionIds,
    });
    return response.data;
  },
};

export default wrappedApi;
