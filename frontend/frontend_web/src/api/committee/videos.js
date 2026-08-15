import api from "../axiosInstance";

/**
 * api/committee/videos.js
 * Wraps every ROLE_COMMITTEE video endpoint from CommitteeVideoController.
 */

export async function uploadVideo(payload, onProgress) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("title", payload.title);
  formData.append("description", payload.description ?? "");
  formData.append("is18Plus", String(payload.is18Plus ?? false));

  const { data } = await api.post("/committee/videos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return data;
}

/** DELETE /committee/videos/{videoUuid} */
export async function deleteVideo(videoUuid) {
  await api.delete(`/committee/videos/${videoUuid}`);
}

/** GET /committee/videos — unfiltered list (committee sees everything). */
export async function listAllVideosCommittee() {
  const { data } = await api.get("/committee/videos");
  return data;
}

/** GET /committee/videos/{videoUuid}/info */
export async function getStreamInfoCommittee(videoUuid) {
  const { data } = await api.get(
    `/committee/videos/${videoUuid}/info`
  );
  return data;
}