import api from "../axiosInstance";

/**
 * api/committee/playlists.js
 * Full playlist CRUD, scoped to ROLE_COMMITTEE.
 */

/** POST /committee/videos/playlists */
export async function createPlaylist(payload) {
  const { data } = await api.post(
    "/committee/videos/playlists",
    payload
  );
  return data;
}

/** PUT /committee/videos/playlists/{playlistId}/videos/{videoUuid}?position= */
export async function addVideoToPlaylist(playlistId, videoUuid, position) {
  const { data } = await api.put(
    `/committee/videos/playlists/${playlistId}/videos/${videoUuid}`,
    null,
    { params: position != null ? { position } : undefined }
  );
  return data;
}

/** DELETE /committee/videos/playlists/{playlistId}/videos/{videoUuid} */
export async function removeVideoFromPlaylist(playlistId, videoUuid) {
  await api.delete(
    `/committee/videos/playlists/${playlistId}/videos/${videoUuid}`
  );
}

/** GET /committee/videos/playlists/{playlistId} */
export async function getPlaylist(playlistId) {
  const { data } = await api.get(
    `/committee/videos/playlists/${playlistId}`
  );
  return data;
}

/** GET /committee/videos/playlists/user/{userId} */
export async function getUserPlaylists(userId) {
  const { data } = await api.get(
    `/committee/videos/playlists/user/${userId}`
  );
  return data;
}