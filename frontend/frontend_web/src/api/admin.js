import API from './axiosInstance';

export const adminUserService = {
  
  searchUsers: async (params = {}) => {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await API.get('/admin/users', { params: cleaned });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await API.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserRole: async (userId, roleId) => {
    const response = await API.put(`/admin/users/${userId}/role`, { roleId });
    return response.data;
  }
};

export const adminAnalyticsService = {
  getAnalytics: async () => {
    const response = await API.get('/admin/users/analytics');
    return response.data;
  },
};

export default adminUserService;