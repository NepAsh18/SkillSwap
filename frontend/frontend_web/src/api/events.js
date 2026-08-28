import api from './axiosInstance';

// Matches ScheduledEventNotificationController:
//   GET /events/notifications              -> ScheduledEventNotificationDocument[]
//   GET /events/notifications/count         -> { unread: number }
//   PUT /events/notifications/{id}/read
//   PUT /events/notifications/read-all

export const fetchEventNotifications = async () => {
  try {
    const response = await api.get('/events/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching event notifications:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchEventUnreadCount = async () => {
  try {
    const response = await api.get('/events/notifications/count');
    return response.data;
  } catch (error) {
    console.error('Error fetching event unread count:', error.response?.data || error.message);
    throw error;
  }
};

export const markEventNotificationRead = async (id) => {
  try {
    await api.put(`/events/notifications/${id}/read`);
  } catch (error) {
    console.error('Error marking event notification read:', error.response?.data || error.message);
    throw error;
  }
};

export const markAllEventNotificationsRead = async () => {
  try {
    await api.put('/events/notifications/read-all');
  } catch (error) {
    console.error('Error marking all event notifications read:', error.response?.data || error.message);
    throw error;
  }
};