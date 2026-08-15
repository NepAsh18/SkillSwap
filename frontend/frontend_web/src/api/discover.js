import api from './axiosInstance';

// Endpoints match MatchmakingController:
//   GET /discover/matches?limit=20   -> { topMatches, adjacent, coldStart }
//   GET /discover/search?q=...&page=&size=   -> UserSearchDocument[]
//   GET /discover/autocomplete?q=...&size=   -> UserSearchDocument[]
// (base path/credentials/auth headers are handled by axiosInstance)

export const fetchTopMatches = async (limit = 20) => {
  try {
    const response = await api.get('/discover/matches', { params: { limit } });
    // Shape: { topMatches: MatchResultDto[], adjacent: MatchResultDto[], coldStart: boolean }
    return response.data;
  } catch (error) {
    console.error('Error fetching top matches:', error.response?.data || error.message);
    throw error;
  }
};

export const searchUsers = async (query, page = 0, size = 10) => {
  try {
    const response = await api.get('/discover/search', {
      params: { q: query, page, size },
    });
    // Shape: UserSearchDocument[] — no score/breakdown, this is raw search not matching
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error.response?.data || error.message);
    throw error;
  }
};

export const autocomplete = async (query, size = 8) => {
  if (!query || !query.trim()) return [];
  try {
    const response = await api.get('/discover/autocomplete', {
      params: { q: query, size },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching autocomplete:', error.response?.data || error.message);
    throw error;
  }
};