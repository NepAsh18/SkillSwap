import { Link } from "react-router-dom";

/**
 * "Up next" rail for WatchPage. Only rendered when the current video
 * belongs to a playlist. Shows a slim progress tracker (segments, not
 * numbers — position in a real sequence) plus the remaining videos.
 */
export default function PlaylistRail({ playlistContext }) {
  const { playlist, entries, currentIndex } = playlistContext;

  return (
    <aside className="xl:w-96 shrink-0">
      <div className="rounded-2xl border border-[#E8E4D8] bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#E8E4D8]">
          <h2 className="font-['Sora'] font-bold text-[#1A1A2E]">{playlist.name}</h2>
          <p className="text-xs text-[#7A7A9A] mt-1">
            {currentIndex + 1} of {entries.length}
          </p>

          {/* Segmented progress tracker — the signature element */}
          <div className="flex gap-1 mt-3">
            {entries.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentIndex ? "bg-[#2FA88A]" : "bg-[#E8E4D8]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {entries.map((pv, i) => {
            const v = pv.video;
            const isCurrent = i === currentIndex;
            return (
              <Link
                key={v.videoUuid}
                to={`/watch/${v.videoUuid}?playlistId=${playlist.id}`}
                className={`flex gap-3 p-3 transition-colors ${
                  isCurrent ? "bg-[#FFF3D0]" : "hover:bg-[#FFFBF0]"
                }`}
              >
                <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-[#1A1A2E] shrink-0">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#7A7A9A] text-xs">
                      No preview
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm line-clamp-2 ${
                      isCurrent ? "font-semibold text-[#1A1A2E]" : "font-medium text-[#3A3A5A]"
                    }`}
                  >
                    {v.title}
                  </div>
                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-[#2FA88A] mt-1 inline-block">
                      Now playing
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}