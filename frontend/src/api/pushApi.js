import api from "./axiosConfig";

const pushApi = {
  subscribe: async (subscription) => {
    const response = await api.post("/api/push/subscribe", subscription);
    return response.data;
  },

  unsubscribe: async (endpoint) => {
    const response = await api.delete("/api/push/subscribe", { data: { endpoint } });
    return response.data;
  },
};

export default pushApi;
