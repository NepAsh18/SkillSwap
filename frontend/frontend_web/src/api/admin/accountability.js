
import api from "../axiosInstance";

/**
 * api/admin/accountability.js
 * Wraps every ROLE_ADMIN endpoint from AdminVideoController, excluding
 * age-verification management which lives in api/admin/ageVerification.js.
 */

/** GET /admin/videos/accountability */
export async function getAllAccountability() {
  const { data } = await api.get("/admin/videos/accountability");
  return data;
}

/** GET /admin/videos/accountability/{videoUuid} */
export async function getAccountabilityByVideo(videoUuid) {
  const { data } = await api.get(
    `/admin/videos/accountability/${videoUuid}`
  );
  return data;
}

/** GET /admin/videos/accountability/uploader/{userId} */
export async function getAccountabilityByUploader(userId) {
  const { data } = await api.get(
    `/admin/videos/accountability/uploader/${userId}`
  );
  return data;
}

/** GET /admin/videos/storage — platform-wide total. */
export async function getStorageSummary() {
  const { data } = await api.get("/admin/videos/storage");
  return data;
}

/** GET /admin/videos/storage/uploader/{userId} */
export async function getStorageByUploader(userId) {
  const { data } = await api.get(
    `/admin/videos/storage/uploader/${userId}`
  );
  return data;
}