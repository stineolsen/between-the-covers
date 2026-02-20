import api from './axiosConfig';

export const usersApi = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/users/profile', profileData);
    return response.data;
  },

  // Upload avatar image
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/api/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Select default avatar
  selectDefaultAvatar: async (avatarName) => {
    const response = await api.put('/api/users/avatar/default', { avatarName });
    return response.data;
  },

  // Delete avatar
  deleteAvatar: async () => {
    const response = await api.delete('/api/users/avatar');
    return response.data;
  },

  // Helper to get avatar URL
  getAvatarUrl: (avatarPath) => {
    if (!avatarPath) return null;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/avatars/${avatarPath}`;
  },

  // Get list of default avatars
  getDefaultAvatars: () => {
    return [
      { name: 'woman-1.png', label: 'Woman' },
      { name: 'woman-2.png', label: 'Woman' },
      { name: 'woman-3.png', label: 'Woman' },
      { name: 'woman-4.png', label: 'Woman' },
      { name: 'woman-old.png', label: 'Woman' },
      { name: 'girl-1.png', label: 'Girl' },
      { name: 'girl-2.png', label: 'Girl' },
      { name: 'woman-reading.png', label: 'Woman' }
    ];
  }
};

export default usersApi;
