import api from "./axiosConfig";

const listNotificationApi = {
  getMine: async () => {
    const response = await api.get("/api/list-notifications/mine");
    return response.data;
  },

  dismiss: async (id) => {
    const response = await api.patch(`/api/list-notifications/${id}/dismiss`);
    return response.data;
  },
};

export default listNotificationApi;
