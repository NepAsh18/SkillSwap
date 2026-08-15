import api from './axiosInstance';

// Endpoints match ConnectionController:
//   POST /connections/request              -> ConnectionRequestResponse
//   POST /connections/{id}/accept          -> ConnectionRequestResponse
//   POST /connections/{id}/decline         -> ConnectionRequestResponse
//   POST /connections/{id}/cancel          -> ConnectionRequestResponse
//   GET  /connections                      -> ConnectionRequestResponse[] (accepted)
//   GET  /connections/sent                 -> ConnectionRequestResponse[] (pending, sent by me)
//   GET  /connections/incoming             -> ConnectionRequestResponse[] (pending, received)
//   GET  /connections/notifications        -> ConnectionNotificationDocument[]
//   GET  /connections/notifications/count  -> { unread: number }
//   PUT  /connections/notifications/{id}/read
//   PUT  /connections/notifications/read-all
// (base path/credentials/auth headers are handled by axiosInstance)

export const sendConnectionRequest = async (user) => {
  try {
    const response = await api.post('/connections/request', {
      receiverId: user.userId,
      receiverName: user.name,
      receiverUsername: user.username,
      receiverPicture: user.picture,
    });
    // Shape: ConnectionRequestResponse
    return response.data;
  } catch (error) {
    console.error('Error sending connection request:', error.response?.data || error.message);
    throw error;
  }
};

export const acceptConnectionRequest = async (requestId) => {
  try {
    const response = await api.post(`/connections/${requestId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting connection request:', error.response?.data || error.message);
    throw error;
  }
};

export const declineConnectionRequest = async (requestId) => {
  try {
    const response = await api.post(`/connections/${requestId}/decline`);
    return response.data;
  } catch (error) {
    console.error('Error declining connection request:', error.response?.data || error.message);
    throw error;
  }
};

export const cancelConnectionRequest = async (requestId) => {
  try {
    const response = await api.post(`/connections/${requestId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error canceling connection request:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchMyConnections = async () => {
  try {
    const response = await api.get('/connections');
    // Shape: ConnectionRequestResponse[] — accepted connections only
    return response.data;
  } catch (error) {
    console.error('Error fetching connections:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchSentRequests = async () => {
  try {
    const response = await api.get('/connections/sent');
    return response.data;
  } catch (error) {
    console.error('Error fetching sent requests:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchIncomingRequests = async () => {
  try {
    const response = await api.get('/connections/incoming');
    return response.data;
  } catch (error) {
    console.error('Error fetching incoming requests:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchNotifications = async () => {
  try {
    const response = await api.get('/connections/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/connections/notifications/count');
    // Shape: { unread: number }
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notification count:', error.response?.data || error.message);
    throw error;
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.put(`/connections/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification read:', error.response?.data || error.message);
    throw error;
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await api.put('/connections/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications read:', error.response?.data || error.message);
    throw error;
  }
};