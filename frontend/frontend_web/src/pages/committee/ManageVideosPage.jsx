import { useCommitteeVideos } from "../../hooks/useCommitteeVideos";
import { extractVideoUuid } from "../../utils/video";
import Navbar from "../../context/Navbar";
import Spinner from "../../components/common/Spinner";
import ErrorBanner from "../../components/common/ErrorBanner";
import EmptyState from "../../components/common/EmptyState";

function Thumb({ video }) {
  return (
    <div className="w-20 aspect-video rounded-lg bg-[#1A1A2E] flex items-center justify-center shrink-0 overflow-hidden border border-[#E8E4D8]">
      {video.thumbnailUrl ? (
        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </div>
  );
}

export default function ManageVideosPage() {
  const { ready, pending, isLoading, error, refetch, removeVideo, deletingId } =
    useCommitteeVideos();

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#F7C45A] flex items-center justify-center text-sm">
            ⚡
          </div>
          <h1 className="font-['Sora'] font-extrabold text-xl text-[#1A1A2E]">Manage videos</h1>
        </div>
        <p className="text-sm text-[#5A5A7A] ml-[42px]">
          Review, audit, and remove uploaded content.
        </p>

        <div className="mt-8">
          {isLoading && <Spinner label="Loading videos" />}
          {error && <ErrorBanner error={error} onRetry={refetch} />}

          {!isLoading && !error && (
            <>
              {/* ── Ready videos ─────────────────────────────────── */}
              <section>
                <h2 className="mb-3 text-sm font-bold text-[#1A1A2E]">
                  Ready to stream ({ready.length})
                </h2>

                {ready.length === 0 ? (
                  <EmptyState title="No ready videos yet" />
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#E8E4D8] bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F5F1E4] text-xs font-bold uppercase tracking-wide text-[#3A3A5A] border-b border-[#E8E4D8]">
                        <tr>
                          <th className="px-4 py-3" colSpan={2}>
                            Video
                          </th>
                          <th className="px-4 py-3">Age rating</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EDE4]">
                        {ready.map((video) => {
                          const videoUuid = extractVideoUuid(video);
                          return (
                            <tr key={video.id} className="hover:bg-[#FFFBF0] transition-colors">
                              <td className="px-4 py-3 w-24">
                                <Thumb video={video} />
                              </td>
                              <td className="px-4 py-3 font-semibold text-[#1A1A2E] text-[0.95rem]">
                                {video.title}
                              </td>
                              <td className="px-4 py-3">
                                {video.is18Plus ? (
                                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                                    18+
                                  </span>
                                ) : (
                                  <span className="rounded bg-[#EAF6EF] px-2 py-0.5 text-xs font-bold text-[#2C7A4F]">
                                    All ages
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  disabled={!videoUuid || deletingId === videoUuid}
                                  onClick={() => removeVideo(videoUuid)}
                                  className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                                >
                                  {deletingId === videoUuid ? "Deleting…" : "Delete"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* ── Still processing ─────────────────────────────── */}
              {pending.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-3 text-sm font-bold text-[#1A1A2E]">
                    Processing ({pending.length})
                  </h2>
                  <div className="flex flex-col gap-2">
                    {pending.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 rounded-xl border border-[#E8E4D8] bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#F5A623] shrink-0" />
                        <span className="text-sm font-semibold text-[#1A1A2E]">{video.title}</span>
                        <span className="ml-auto text-xs font-medium text-[#7A7A9A]">
                          Processing — check back soon
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}