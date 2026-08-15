import api from './axiosInstance';

export const initiateAssessment = async (userId) => {
  try {
    const response = await api.get(`/ai/assessment/initiate/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error initiating assessment:', error.response?.data || error.message);
    throw error;
  }
};

export const submitAnswers = async (sessionId, answers) => {
  try {
    const response = await api.post(`/ai/assessment/submit/${sessionId}`, { answers });
    return response.data;
  } catch (error) {
    console.error('Error submitting answers:', error.response?.data || error.message);
    throw error;
  }
};