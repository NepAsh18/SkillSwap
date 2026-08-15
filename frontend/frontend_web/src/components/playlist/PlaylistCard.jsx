export default function PlaylistCard({ playlist }) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-900">{playlist.name}</h3>
        {playlist.isPrivate && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
            Private
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-stone-500">
        {playlist.videos.length} video{playlist.videos.length === 1 ? "" : "s"}
      </p>
      {playlist.videos.length > 0 && (
        <ol className="mt-3 flex flex-col gap-1.5">
          {playlist.videos
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((pv) => (
              <li key={pv.video.id} className="flex items-center gap-2 text-xs text-stone-600">
                <span className="w-4 shrink-0 text-stone-400">{pv.position}</span>
                <span className="line-clamp-1">{pv.video.title}</span>
                {pv.video.is18Plus && (
                  <span className="shrink-0 rounded bg-red-100 px-1 text-[9px] font-semibold text-red-700">
                    18+
                  </span>
                )}
              </li>
            ))}
        </ol>
      )}
    </div>
  );
}