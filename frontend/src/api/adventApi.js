import api from "./axiosConfig";

export const adventApi = {
  getCalendar: async (year) => {
    const response = await api.get(`/api/advent/${year}`);
    return response.data;
  },

  getDay: async (year, day) => {
    const response = await api.get(`/api/advent/${year}/${day}`);
    return response.data;
  },

  submitAttempt: async (year, day, { action, bookId }) => {
    const response = await api.post(`/api/advent/${year}/${day}/attempt`, { action, bookId });
    return response.data;
  },

  search: async (q) => {
    const response = await api.get("/api/advent/search", { params: { q } });
    return response.data;
  },

  getLeaderboard: async (year) => {
    const response = await api.get(`/api/advent/${year}/leaderboard`);
    return response.data;
  },

  // The image route needs the same auth as everything else (cookie or
  // bearer token), which a plain <img src> can't send cross-origin - so we
  // fetch it as a blob through the authenticated axios instance instead.
  // Caller is responsible for URL.revokeObjectURL on the result.
  getImageBlobUrl: async (year, day, level) => {
    const response = await api.get(`/api/advent/${year}/${day}/image/${level}`, {
      responseType: "blob",
    });
    return URL.createObjectURL(response.data);
  },

  // Admin only
  adminListDays: async (year) => {
    const response = await api.get(`/api/advent/${year}/admin`);
    return response.data;
  },

  adminCreateDay: async (year, day, data) => {
    const response = await api.post(`/api/advent/${year}/${day}/admin`, data);
    return response.data;
  },

  adminUpdateDay: async (year, day, updates) => {
    const response = await api.put(`/api/advent/${year}/${day}/admin`, updates);
    return response.data;
  },

  adminDeleteDay: async (year, day) => {
    const response = await api.delete(`/api/advent/${year}/${day}/admin`);
    return response.data;
  },

  adminPublishDue: async (year) => {
    const response = await api.post(`/api/advent/${year}/admin/publish-due`);
    return response.data;
  },

  adminRecalculateBadges: async (year) => {
    const response = await api.post(`/api/advent/${year}/admin/recalculate-badges`);
    return response.data;
  },

  adminUploadDayImage: async (year, day, file) => {
    const formData = new FormData();
    formData.append("cover", file);
    const response = await api.post(`/api/advent/${year}/${day}/admin/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  adminGetVisibility: async (year) => {
    const response = await api.get(`/api/advent/${year}/admin/visibility`);
    return response.data;
  },

  adminSetVisibility: async (year, visibility) => {
    const response = await api.put(`/api/advent/${year}/admin/visibility`, { visibility });
    return response.data;
  },
};

export default adventApi;
