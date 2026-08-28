import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

/**
 * useHlsPlayer — attaches hls.js to a <video> ref with bearer-token auth.
 *
 * Now also exposes manual quality control: `levels` (label + height per
 * rendition, ordered as hls.js reports them) and `currentLevel` / `setLevel`
 * so the UI can offer a quality picker instead of relying purely on ABR.
 * `-1` means "Auto" (adaptive, hls.js decides).
 */
export function useHlsPlayer(masterPlaylistUrl, baseUrl) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [levels, setLevels] = useState([]); // [{ index, height, label }]
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto

  useEffect(() => {
    if (!masterPlaylistUrl || !videoRef.current) return;

    const fullUrl = `${baseUrl}${masterPlaylistUrl}`;
    const video = videoRef.current;
    setError(null);
    setIsReady(false);
    setLevels([]);
    setCurrentLevel(-1);

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          const token = localStorage.getItem("token");
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        },
      });
      hlsRef.current = hls;

      hls.loadSource(fullUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
        setIsReady(true);
        const parsed = data.levels
          .map((lvl, index) => ({ index, height: lvl.height, label: `${lvl.height}p` }))
          .sort((a, b) => b.height - a.height);
        setLevels(parsed);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_evt, data) => {
        // Only reflects actual playback level; stays in sync even under Auto.
        setCurrentLevel(hls.autoLevelEnabled ? -1 : data.level);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(new Error(data.details || "HLS playback failed"));
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = fullUrl;
      setIsReady(true);
      // Native Safari HLS: no manual level control available.
      return undefined;
    }

    setError(new Error("HLS is not supported in this browser."));
    return undefined;
  }, [masterPlaylistUrl, baseUrl]);

  const setLevel = useCallback((levelIndex) => {
    const hls = hlsRef.current;
    if (!hls) return;
    if (levelIndex === -1) {
      hls.currentLevel = -1; // re-enable Auto/ABR
    } else {
      hls.currentLevel = levelIndex; // force this rendition immediately
    }
    setCurrentLevel(levelIndex);
  }, []);

  return { videoRef, error, isReady, levels, currentLevel, setLevel };
}