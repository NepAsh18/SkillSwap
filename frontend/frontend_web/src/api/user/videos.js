import api from "../axiosInstance";

/**
 * api/user/videos.js
 * Wraps every ROLE_USER video endpoint from VideoStreamController.
 */

/** GET /videos — full catalog, 18+ titles included but stream-gated. */
export async function listVideos() {
  const { data } = await api.get("/videos");
  return data;
}

/**
 * GET /videos/{videoUuid}/info
 * Throws an AxiosError with response.status === 403 if the video is 18+
 * and the user hasn't passed age verification — catch this in the UI to
 * show the AgeGateModal instead of a generic error.
 */
export async function getStreamInfo(videoUuid) {
  const { data } = await api.get(`/videos/${videoUuid}/info`);
  return data;
}

/**
 * Returns the absolute master playlist URL for the HLS player.
 * Not an axios call — hls.js / the <video> element fetches this directly,
 * but the URL still needs the bearer token (api config doesn't
 * apply to <video src>), so most setups proxy this through a blob fetch.
 * See VideoPlayer.jsx for the blob-URL pattern that keeps this authenticated.
 */
export function getMasterPlaylistPath(videoUuid) {
  return `/videos/${videoUuid}/master.m3u8`;
}

/** POST /videos/verify-age — submit the client-generated ZK proof. */
export async function verifyAge(zkProof) {
  const { data } = await api.post("/videos/verify-age", {
    zkProof: JSON.stringify(zkProof), // {y,t,s} -> a JSON string, matching what the server expects to parse
  });
  return data;
}