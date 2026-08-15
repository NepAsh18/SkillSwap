import { useCallback, useEffect, useState } from "react";
import { listVideos } from "../api/user/videos";


export function useVideos() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listVideos();
      setVideos(data.filter((v) => v.videoUrl !== null));
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { videos, isLoading, error, refetch };
}