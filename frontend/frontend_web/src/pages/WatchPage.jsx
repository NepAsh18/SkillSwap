import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useVideoStream } from "../hooks/useVideoStream";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import AgeGateModal from "../components/video/AgeGateModal";
import VideoPlayer from "../components/video/VideoPlayer";



export default function WatchPage() {
    

  const { videoUuid } = useParams();
  const {
    streamInfo,
    isLoading,
    isAgeRestricted,
    error,
    refetch,
  } = useVideoStream(videoUuid);
 

  const [theaterMode, setTheaterMode] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Spinner label="Loading video..." />
      </div>
    );
  }

  if (error && !isAgeRestricted) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <ErrorBanner error={error} onRetry={refetch} />
      </div>
    );
  }

  if (isAgeRestricted) {
    return (
      <AgeGateModal
        onVerified={refetch}
        onCancel={() => window.history.back()}
      />
    );
  }

  if (!streamInfo) return null;

  const playlist = Array.from({ length: 8 });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className={`mx-auto transition-all duration-300 ${theaterMode ? "max-w-full px-0" : "max-w-7xl px-5 py-6"}`}>
        <div className={`flex gap-6 ${theaterMode ? "flex-col" : "flex-col xl:flex-row"}`}>
          <div className="flex-1">
            <div className={`${theaterMode ? "rounded-none" : "rounded-2xl"} overflow-hidden bg-black border border-slate-800`}>
              {streamInfo.processingStatus === "READY" ? (
                <VideoPlayer masterPlaylistUrl={streamInfo.masterPlaylistUrl} />
              ) : (
                <div className="aspect-video flex items-center justify-center text-slate-400">
                  Processing: {streamInfo.processingStatus}
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setTheaterMode(!theaterMode)}
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold"
              >
                {theaterMode ? "Exit Theater" : "Theater Mode"}
              </button>
            </div>

            <div className="mt-6">
              <h1 className="text-2xl font-bold">{streamInfo.title}</h1>

              <div className="mt-2 text-sm text-slate-400">
                Ready to stream
              </div>

              <div className="mt-6 rounded-xl bg-slate-900 border border-slate-800 p-5">
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-slate-300 whitespace-pre-wrap">
                  {streamInfo.description || "No description available."}
                </p>
              </div>
            </div>
          </div>

          {!theaterMode && (
            <aside className="xl:w-96">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800">
                  <h2 className="font-semibold text-lg">Playlist</h2>
                </div>

                <div className="max-h-[75vh] overflow-y-auto">
                  {playlist.map((_, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 p-3 cursor-pointer hover:bg-slate-800 transition ${
                        index === 0 ? "bg-slate-800" : ""
                      }`}
                    >
                      <div className="w-36 aspect-video rounded-lg bg-slate-700 flex items-center justify-center text-xs">
                        Thumbnail
                      </div>

                      <div className="flex-1">
                        <div className="font-medium line-clamp-2">
                          Playlist Video {index + 1}
                        </div>

                        <div className="text-xs text-slate-400 mt-2">
                          Creator
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}