import api from './axiosConfig';

const activityApi = {
  getActivity: async (limit = 25) => {
    const response = await api.get(`/api/activity?limit=${limit}`);
    return response.data;
  }
};

export default activityApi;
