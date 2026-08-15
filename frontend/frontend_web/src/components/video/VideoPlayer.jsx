import { useHlsPlayer } from "../../hooks/useHlsPlayer";
import ErrorBanner from "../common/ErrorBanner";
import Spinner from "../common/Spinner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";


export default function VideoPlayer({ masterPlaylistUrl }) {
  const { videoRef, error, isReady } = useHlsPlayer(masterPlaylistUrl, API_BASE_URL);

  if (error) {
    return <ErrorBanner error={error} />;
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <Spinner label="Loading stream" />
        </div>
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} controls className="aspect-video w-full" />
    </div>
  );
}