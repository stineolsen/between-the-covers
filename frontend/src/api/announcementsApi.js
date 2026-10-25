import api from "./axiosConfig";

const announcementsApi = {
  getActive: async () => {
    const response = await api.get("/api/announcements");
    return response.data;
  },

  getAllForAdmin: async () => {
    const response = await api.get("/api/announcements/admin");
    return response.data;
  },

  create: async (html, duration) => {
    const response = await api.post("/api/announcements", { html, duration });
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/api/announcements/${id}`);
    return response.data;
  },
};

export default announcementsApi;
