import api from './axiosConfig';

export const meetingsApi = {
  // Get all meetings (optionally filtered)
  getMeetings: async (params = {}) => {
    const response = await api.get('/api/meetings', { params });
    return response.data;
  },

  // Get next upcoming meeting
  getNextMeeting: async () => {
    try {
      const response = await api.get('/api/meetings/next');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, meeting: null };
      }
      throw error;
    }
  },

  // Get single meeting
  getMeeting: async (id) => {
    const response = await api.get(`/api/meetings/${id}`);
    return response.data;
  },

  // Create meeting (admin only)
  createMeeting: async (meetingData) => {
    const response = await api.post('/api/meetings', meetingData);
    return response.data;
  },

  // Update meeting (admin only)
  updateMeeting: async (id, meetingData) => {
    const response = await api.put(`/api/meetings/${id}`, meetingData);
    return response.data;
  },

  // Delete meeting (admin only)
  deleteMeeting: async (id) => {
    const response = await api.delete(`/api/meetings/${id}`);
    return response.data;
  },

  // RSVP to meeting (toggle)
  rsvpMeeting: async (id) => {
    const response = await api.post(`/api/meetings/${id}/rsvp`);
    return response.data;
  }
};

export default meetingsApi;
