import { useState } from "react";
import { useHlsPlayer } from "../../hooks/useHlsPlayer";
import ErrorBanner from "../common/ErrorBanner";
import Spinner from "../common/Spinner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function VideoPlayer({ masterPlaylistUrl }) {
  const { videoRef, error, isReady, levels, currentLevel, setLevel } = useHlsPlayer(
    masterPlaylistUrl,
    API_BASE_URL
  );
  const [menuOpen, setMenuOpen] = useState(false);

  if (error) {
    return <ErrorBanner error={error} />;
  }

  const activeLabel =
    currentLevel === -1 ? "Auto" : levels.find((l) => l.index === currentLevel)?.label ?? "Auto";

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <Spinner label="Loading stream" />
        </div>
      )}

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} controls className="aspect-video w-full" />

      {isReady && levels.length > 0 && (
        <div className="absolute bottom-14 right-3 z-20">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-black/70 hover:bg-black/85 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
          >
            {activeLabel}
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute bottom-full mb-1 right-0 rounded-lg bg-black/90 overflow-hidden min-w-[110px] shadow-lg">
              <button
                onClick={() => {
                  setLevel(-1);
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                  currentLevel === -1
                    ? "bg-[#F5A623] text-[#1A1A2E]"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Auto
              </button>
              {levels.map((lvl) => (
                <button
                  key={lvl.index}
                  onClick={() => {
                    setLevel(lvl.index);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                    currentLevel === lvl.index
                      ? "bg-[#F5A623] text-[#1A1A2E]"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}