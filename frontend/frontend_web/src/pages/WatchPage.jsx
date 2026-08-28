import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useVideoStream } from "../hooks/useVideoStream";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import AgeGateModal from "../components/video/AgeGateModal";
import VideoPlayer from "../components/video/VideoPlayer";
import PlaylistRail from "../components/video/PlaylistRail";

export default function WatchPage() {
  const { videoUuid } = useParams();
  const { streamInfo, playlistContext, isLoading, isAgeRestricted, error, refetch } =
    useVideoStream(videoUuid);

  const [theaterMode, setTheaterMode] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <Spinner label="Loading video…" />
      </div>
    );
  }

  if (error && !isAgeRestricted) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] p-6">
        <ErrorBanner error={error} onRetry={refetch} />
      </div>
    );
  }

  if (isAgeRestricted) {
    return <AgeGateModal onVerified={refetch} onCancel={() => window.history.back()} />;
  }

  if (!streamInfo) return null;

  const hasPlaylist = Boolean(playlistContext);

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-[#1A1A2E]">
      <div
        className={`mx-auto transition-all duration-300 ${
          theaterMode ? "max-w-full px-0" : "max-w-7xl px-5 py-8"
        }`}
      >
        <div className={`flex gap-6 ${theaterMode ? "flex-col" : "flex-col xl:flex-row"}`}>
          <div className="flex-1 min-w-0">
            <div
              className={`${
                theaterMode ? "rounded-none" : "rounded-2xl"
              } overflow-hidden bg-black border border-[#E8E4D8] shadow-sm`}
            >
              {streamInfo.processingStatus === "READY" ? (
                <VideoPlayer
                  masterPlaylistUrl={streamInfo.masterPlaylistUrl}
                  qualities={streamInfo.qualities}
                />
              ) : (
                <div className="aspect-video flex items-center justify-center text-[#B0ADBE]">
                  Processing — {streamInfo.processingStatus.toLowerCase()}
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setTheaterMode(!theaterMode)}
                className="px-4 py-2 rounded-lg bg-[#F5A623] hover:bg-[#E0951A] text-[#1A1A2E] font-['Inter'] font-semibold text-sm transition-colors"
              >
                {theaterMode ? "Exit theater" : "Theater mode"}
              </button>
            </div>

            <div className="mt-6">
              <h1 className="font-['Sora'] font-extrabold text-2xl">{streamInfo.title}</h1>

              <div className="mt-2 text-sm text-[#2FA88A] font-medium">Ready to stream</div>

              <div className="mt-6 rounded-xl bg-white border border-[#E8E4D8] p-5">
                <h2 className="font-['Sora'] font-bold text-sm text-[#1A1A2E] mb-2">
                  Description
                </h2>
                <p className="text-[#3A3A5A] text-sm whitespace-pre-wrap leading-relaxed">
                  {streamInfo.description || "No description available."}
                </p>
              </div>
            </div>
          </div>

          {!theaterMode && hasPlaylist && <PlaylistRail playlistContext={playlistContext} />}
        </div>
      </div>
    </div>
  );
}