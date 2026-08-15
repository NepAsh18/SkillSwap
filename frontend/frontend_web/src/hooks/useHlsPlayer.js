import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";


/**
 * useHlsPlayer — attaches hls.js to a <video> ref with bearer-token auth.
 *
 * Why this exists: <video src="..."> can't send an Authorization header,
 * but every HLS endpoint on the backend (master.m3u8, variant playlists,
 * .ts segments) is behind the age-gate + JWT filter. hls.js's xhrSetup
 * hook lets us inject the header on every manifest and segment request,
 * which is the standard way to stream protected HLS without a signed-URL
 * layer in front of it.
 *
 * Falls back to native HLS (Safari) which can't send custom headers per
 * segment — if you need to support Safari with protected streams, put a
 * short-lived signed URL or cookie-based auth in front of HLS_DIR instead.
 */
export function useHlsPlayer(masterPlaylistUrl, baseUrl) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!masterPlaylistUrl || !videoRef.current) return;

    const fullUrl = `${baseUrl}${masterPlaylistUrl}`;
    const video = videoRef.current;
    setError(null);
    setIsReady(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          const token = localStorage.getItem("token");
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        },
      });

      hls.loadSource(fullUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => setIsReady(true));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(new Error(data.details || "HLS playback failed"));
        }
      });

      return () => hls.destroy();
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      
      video.src = fullUrl;
      setIsReady(true);
      return undefined;
    }

    setError(new Error("HLS is not supported in this browser."));
    return undefined;
  }, [masterPlaylistUrl, baseUrl]);

  return { videoRef, error, isReady };
}