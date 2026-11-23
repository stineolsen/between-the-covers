import api from "./axiosConfig";

export const secretSantaApi = {
  // The signed-in member's own match ({ open: false } until admin opens it)
  getMine: async () => {
    const response = await api.get("/api/secret-santa/me");
    return response.data;
  },

  // Admin - never returns the pairs, since admin takes part too
  getAdmin: async () => {
    const response = await api.get("/api/secret-santa/admin");
    return response.data;
  },

  draw: async () => {
    const response = await api.post("/api/secret-santa/admin/draw");
    return response.data;
  },

  setOpen: async (open) => {
    const response = await api.put("/api/secret-santa/admin/open", { open });
    return response.data;
  },

  reset: async () => {
    const response = await api.delete("/api/secret-santa/admin");
    return response.data;
  },
};

export default secretSantaApi;
