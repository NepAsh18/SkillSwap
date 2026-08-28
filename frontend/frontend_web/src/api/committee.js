import API from './axiosInstance';

export const committeeBadgeService = {
  /**
   * Fetch the top-ranked badges (leaderboard), optionally filtered by skill.
   * @param {number} limit - max number of results (defaults to 20 server-side)
   * @param {string} [skill] - optional skill name filter
   */
  getTopBadges: async (limit = 20, skill = undefined) => {
    const params = Object.fromEntries(
      Object.entries({ limit, skill }).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      )
    );
    const response = await API.get('/committee/badges/top', { params });
    return response.data;
  },
};

export default committeeBadgeService;