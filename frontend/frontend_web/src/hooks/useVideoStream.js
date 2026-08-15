import { useCallback, useEffect, useState } from "react";
import { getStreamInfo } from "../api/user/videos";

/**
 * useVideoStream — fetches /videos/{uuid}/info and distinguishes the
 * "blocked by age gate" case (HTTP 403 from VideoAgeGateService) from
 * every other error, so WatchPage can render the AgeGateModal instead
 * of a generic failure screen.
 */
export function useVideoStream(videoUuid) {
  const [streamInfo, setStreamInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAgeRestricted, setIsAgeRestricted] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!videoUuid) return;
    setIsLoading(true);
    setError(null);
    setIsAgeRestricted(false);
    try {
      const data = await getStreamInfo(videoUuid);
      setStreamInfo(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setIsAgeRestricted(true);
      } else {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [videoUuid]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { streamInfo, isLoading, isAgeRestricted, error, refetch };
}