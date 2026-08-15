import api from "../axiosInstance";

/**
 * api/user/playlists.js
 * Wraps the playlist endpoints exposed to ROLE_USER.
 */

/** GET /videos/playlists/my — the caller's own playlists. */
export async function getMyPlaylists() {
  const { data } = await api.get("/videos/playlists/my");
  return data;
}

/** GET /videos/playlists/{playlistId} */
export async function getPlaylist(playlistId) {
  const { data } = await api.get(`/videos/playlists/${playlistId}`);
  return data;
}

/**
 * POST /videos/playlists
 * @param {{ userId: string, name: string, isPrivate: boolean }} payload
 */
export async function createPlaylist(payload) {
  const { data } = await api.post("/videos/playlists", payload);
  return data;
}