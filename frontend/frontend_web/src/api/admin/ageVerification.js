import api from "../axiosInstance";

/**
 * api/admin/ageVerification.js
 * Admin-only inspection and revocation of a user's age-gate status.
 */

/** GET /admin/videos/age-verification/{userId} → { userId, isVerified } */
export async function getAgeVerificationStatus(userId) {
  const { data } = await api.get(
    `/admin/videos/age-verification/${userId}`
  );
  return data;
}

/** DELETE /admin/videos/age-verification/{userId} — force re-verification. */
export async function revokeAgeVerification(userId) {
  await api.delete(`/admin/videos/age-verification/${userId}`);
}