import api from './axiosInstance';

export const getUserBadges = async (userId) => {
  try {
    const response = await api.get(`/ai/badge/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching badges:', error.response?.data || error.message);
    throw error;
  }
};

export const getBadgeBySkill = async (userId, skill) => {
  try {
    const response = await api.get(`/ai/badge/${userId}/${skill}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching badge:', error.response?.data || error.message);
    throw error;
  }
};