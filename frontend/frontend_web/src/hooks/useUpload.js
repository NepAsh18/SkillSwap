import { useCallback, useState } from "react";
import { uploadVideo } from "../api/committee/videos";


export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | uploading | processing | done | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const upload = useCallback(async (payload) => {
    setPhase("uploading");
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const data = await uploadVideo(payload, (percent) => {
        setProgress(percent);
        if (percent >= 100) setPhase("processing");
      });
      setResult(data);
      setPhase("done");
      return data;
    } catch (err) {
      setError(err);
      setPhase("error");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setPhase("idle");
    setError(null);
    setResult(null);
  }, []);

  return { upload, progress, phase, error, result, reset };
}