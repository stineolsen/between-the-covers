import api from "./axiosConfig";

export const wrappedApi = {
  getOverview: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/overview`);
    return response.data;
  },

  confirmBooks: async (year, excludedBookIds, parkUserBookIds = []) => {
    const response = await api.put(`/api/wrapped/${year}/confirm-books`, {
      excludedBookIds,
      parkUserBookIds,
    });
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

  // Step 1: star rating for a read book (star-only reviews stay out of the feed)
  setQuickRating: async (year, bookId, rating) => {
    const response = await api.put(`/api/wrapped/${year}/rating`, { bookId, rating });
    return response.data;
  },

  // Step 3: which of the year's meetings the member actually attended
  getMeetings: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/meetings`);
    return response.data;
  },

  saveMeetings: async (year, attendedMeetingIds) => {
    const response = await api.put(`/api/wrapped/${year}/meetings`, { attendedMeetingIds });
    return response.data;
  },

  getStatus: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/status`);
    return response.data;
  },

  // Results side (release-gated) + live year-so-far stats
  getRelease: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/release`);
    return response.data;
  },

  getLive: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/live`);
    return response.data;
  },

  // `userId` lets an admin preview another member's results before release
  getResults: async (year, userId) => {
    const response = await api.get(`/api/wrapped/${year}/results`, {
      params: userId ? { user: userId } : {},
    });
    return response.data;
  },

  // Admin only
  getAdminRelease: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/admin/release`);
    return response.data;
  },

  setAdminRelease: async (year, at) => {
    const response = await api.put(`/api/wrapped/${year}/admin/release`, { at });
    return response.data;
  },

  getAdminMembers: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/admin/members`);
    return response.data;
  },

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

  getAdminVisibility: async (year) => {
    const response = await api.get(`/api/wrapped/${year}/admin/visibility`);
    return response.data;
  },

  setAdminVisibility: async (year, visibility) => {
    const response = await api.put(`/api/wrapped/${year}/admin/visibility`, { visibility });
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
