import api from "./axiosConfig";

export const badgesApi = {
  getUserBadges: async (userId) => {
    const response = await api.get(`/api/users/${userId}/badges`);
    return response.data;
  },
};

export default badgesApi;
