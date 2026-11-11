import api from "./axiosConfig";

export const badgesApi = {
  getUserBadges: async (userId) => {
    const response = await api.get(`/api/users/${userId}/badges`);
    return response.data;
  },

  // The signed-in member's whole catalogue with progress
  getMyBadges: async () => {
    const response = await api.get("/api/badges/me");
    return response.data;
  },

  // Admin only
  getAdminStatus: async () => {
    const response = await api.get("/api/badges/admin/status");
    return response.data;
  },

  getAdminPreview: async () => {
    const response = await api.get("/api/badges/admin/preview");
    return response.data;
  },

  setLaunched: async (enabled) => {
    const response = await api.put("/api/badges/admin/launch", { enabled });
    return response.data;
  },

  recalculate: async () => {
    const response = await api.post("/api/badges/admin/recalculate");
    return response.data;
  },
};

export default badgesApi;
