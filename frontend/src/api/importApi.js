import api from "./axiosConfig";

export const importApi = {
  // Get the stored "import books since" date
  getStatus: async () => {
    const response = await api.get("/api/admin/import/status");
    return response.data;
  },

  // Update the stored "import books since" date (pass null to clear it / do a full import)
  setCalibreSince: async (since) => {
    const response = await api.post("/api/admin/import/calibre/since", { since });
    return response.data;
  },

  // Run the Calibre-Web OPDS book import
  runCalibreImport: async () => {
    const response = await api.post("/api/admin/import/calibre/run");
    return response.data;
  },

  // Run the Audiobookshelf audiobook link sync
  runAbsSync: async () => {
    const response = await api.post("/api/admin/import/abs/run");
    return response.data;
  },
};

export default importApi;
