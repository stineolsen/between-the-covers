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

  saveAwards: async (year, awards) => {
    const response = await api.put(`/api/wrapped/${year}/awards`, awards);
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
};

export default wrappedApi;
