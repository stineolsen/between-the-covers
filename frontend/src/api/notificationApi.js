import api from "./axiosConfig";

export const notificationApi = {
  // Admin: broadcast an announcement email (e.g. new feature alert) to
  // everyone opted into feature alerts
  sendFeatureAlert: async (subject, message) => {
    const response = await api.post("/api/admin/notifications/feature-alert", { subject, message });
    return response.data;
  },
};

export default notificationApi;
