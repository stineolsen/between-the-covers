import api from "./axiosConfig";

const notificationCenterApi = {
  getMine: async (limit = 20) => {
    const response = await api.get(`/api/notifications?limit=${limit}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/api/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch("/api/notifications/read-all");
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  },
};

export default notificationCenterApi;
