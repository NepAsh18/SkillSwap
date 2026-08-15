import api from './axiosInstance';

export const submitFeedback = async (targetUserId, skill, stars, comment = '') => {
  try {
    const response = await api.post('/feedback', { targetUserId, skill, stars, comment });
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error.response?.data || error.message);
    throw error;
  }
};

export const getFeedbackForUserSkill = async (targetUserId, skill) => {
  try {
    const response = await api.get(`/feedback/${targetUserId}/${skill}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback:', error.response?.data || error.message);
    throw error;
  }
};