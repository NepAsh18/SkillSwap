import { useCommitteeVideos } from "../../hooks/useCommitteeVideos";
import { extractVideoUuid } from "../../utils/video";
import Spinner from "../../components/common/Spinner";
import ErrorBanner from "../../components/common/ErrorBanner";
import EmptyState from "../../components/common/EmptyState";

export default function ManageVideosPage() {
  const { ready, pending, isLoading, error, refetch, removeVideo, deletingId } =
    useCommitteeVideos();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold text-stone-900">Manage videos</h1>

      <div className="mt-6">
        {isLoading && <Spinner label="Loading videos" />}
        {error && <ErrorBanner error={error} onRetry={refetch} />}

        {!isLoading && !error && (
          <>
            {/* ── Ready videos ─────────────────────────────────── */}
            <section>
              <h2 className="mb-3 text-sm font-medium text-stone-700">
                Ready to stream ({ready.length})
              </h2>

              {ready.length === 0 ? (
                <EmptyState title="No ready videos yet" />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-stone-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Title</th>
                        <th className="px-4 py-2.5 font-medium">18+</th>
                        <th className="px-4 py-2.5 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {ready.map((video) => {
                        const videoUuid = extractVideoUuid(video);
                        return (
                          <tr key={video.id}>
                            <td className="px-4 py-2.5 font-medium text-stone-900">
                              {video.title}
                            </td>
                            <td className="px-4 py-2.5">
                              {video.is18Plus ? (
                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                                  18+
                                </span>
                              ) : (
                                <span className="text-stone-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                type="button"
                                disabled={!videoUuid || deletingId === videoUuid}
                                onClick={() => removeVideo(videoUuid)}
                                className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
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
                <h2 className="mb-3 text-sm font-medium text-stone-700">
                  Processing ({pending.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {pending.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 rounded-lg border border-stone-200 px-4 py-3"
                    >
                      <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                      <span className="text-sm text-stone-600">{video.title}</span>
                      <span className="ml-auto text-xs text-stone-400">
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
  );
}