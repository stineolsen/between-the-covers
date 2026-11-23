import api from "./axiosConfig";

// Personal key for the iPhone widgets (Scriptable)
export const widgetApi = {
  getTokenStatus: async () => (await api.get("/api/widget/token")).data,
  createToken: async () => (await api.post("/api/widget/token")).data,
  deleteToken: async () => (await api.delete("/api/widget/token")).data,
};
