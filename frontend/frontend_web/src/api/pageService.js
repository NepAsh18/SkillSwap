import API from './axiosInstance';

export const pageService = {
  // Public
  getPageBySlug: async (slug) => {
    const response = await API.get(`/home/public/pages/${slug}`);
    return response.data;
  },

  // Public: lightweight list of { id, slug, title } for nav/buttons — no auth required
  getAllSlugs: async () => {
    const response = await API.get('/home/public/pages');
    return response.data;
  },

  getAllPages: async () => {
    const response = await API.get('/home/admin/pages');
    return response.data;
  },

  // Admin Page Management
  createPage: async (pageData) => {
    const response = await API.post('/home/admin/pages', pageData);
    return response.data;
  },

  updatePage: async (pageId, pageData) => {
    const response = await API.put(`/home/admin/pages/${pageId}`, pageData);
    return response.data;
  },

  deletePage: async (pageId) => {
    const response = await API.delete(`/home/admin/pages/${pageId}`);
    return response.data;
  },

  // Admin Section Management
  addSection: async (pageId, sectionData) => {
    const response = await API.post(`/home/admin/pages/${pageId}/sections`, sectionData);
    return response.data;
  },

  updateSection: async (sectionId, sectionData) => {
    const response = await API.put(`/home/admin/sections/${sectionId}`, sectionData);
    return response.data;
  },

  deleteSection: async (sectionId) => {
    const response = await API.delete(`/home/admin/sections/${sectionId}`);
    return response.data;
  }
};