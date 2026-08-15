import api from './axiosInstance';

export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error.response?.data || error.message);
    throw error;
  }
};

export const getNotificationCount = async () => {
  try {
    const response = await api.get('/notifications/count');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification count:', error.response?.data || error.message);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification read:', error.response?.data || error.message);
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await api.put('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all read:', error.response?.data || error.message);
    throw error;
  }
};