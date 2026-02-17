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
      { name: 'default-purple.svg', label: 'Purple Book 📚' },
      { name: 'default-pink.svg', label: 'Pink Flower 🌸' },
      { name: 'default-teal.svg', label: 'Teal Art 🎨' },
      { name: 'default-orange.svg', label: 'Orange Coffee ☕' },
      { name: 'default-green.svg', label: 'Green Nature 🌿' }
    ];
  }
};

export default usersApi;
