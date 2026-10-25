import api from "./axiosConfig";

export const settingsApi = {
  getSeasonalTheme: async () => {
    const response = await api.get("/api/settings/seasonal-theme");
    return response.data;
  },

  setSeasonalTheme: async (theme) => {
    const response = await api.put("/api/settings/seasonal-theme", { theme });
    return response.data;
  },

  getBanner: async () => {
    const response = await api.get("/api/settings/banner");
    return response.data;
  },

  getBannerForAdmin: async () => {
    const response = await api.get("/api/settings/banner/admin");
    return response.data;
  },

  setBanner: async (html, enabled) => {
    const response = await api.put("/api/settings/banner", { html, enabled });
    return response.data;
  },
};

export default settingsApi;
