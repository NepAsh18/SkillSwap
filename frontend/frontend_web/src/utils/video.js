export function extractVideoUuid(video) {
  if (video.videoUuid) return video.videoUuid; // future-proof, once DTO is fixed
  if (!video.videoUrl) return null;
 
  const match = video.videoUrl.match(
    /\/videos\/([0-9a-fA-F-]{36})\//
  );
  return match ? match[1] : null;
}
