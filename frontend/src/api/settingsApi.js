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
};

export default settingsApi;
