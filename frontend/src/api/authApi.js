import api from './axiosConfig';

export const authApi = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Get pending users (admin only)
  getPendingUsers: async () => {
    const response = await api.get('/api/auth/pending');
    return response.data;
  },

  // Approve or reject user (admin only)
  approveUser: async (userId, status) => {
    const response = await api.put(`/api/auth/approve/${userId}`, { status });
    return response.data;
  }
};

export default authApi;
