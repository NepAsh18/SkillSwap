import { useCallback, useEffect, useState } from "react";
import { listAllVideosCommittee, deleteVideo } from "../api/committee/videos";

/**
 * useCommitteeVideos — backs ManageVideosPage.jsx.
 * Committee sees all videos split into two lists:
 *   ready    → videoUrl !== null, fully streamable, can be deleted
 *   pending  → videoUrl === null, still processing or failed, shown read-only
 */
export function useCommitteeVideos() {
  const [ready, setReady] = useState([]);
  const [pending, setPending] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAllVideosCommittee();
      setReady(data.filter((v) => v.videoUrl !== null));
      setPending(data.filter((v) => v.videoUrl === null));
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const removeVideo = useCallback(async (videoUuid) => {
    setDeletingId(videoUuid);
    try {
      await deleteVideo(videoUuid);
      setReady((prev) => prev.filter((v) => {
        const match = v.videoUrl?.match(/\/videos\/([0-9a-fA-F-]{36})\//);
        return match?.[1] !== videoUuid;
      }));
    } catch (err) {
      setError(err);
    } finally {
      setDeletingId(null);
    }
  }, []);

  return { ready, pending, isLoading, error, refetch, removeVideo, deletingId };
}