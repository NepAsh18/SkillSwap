import { Link } from "react-router-dom";
import { watchPath } from "../../constants/routes";
import { extractVideoUuid } from "../../utils/video";

export default function VideoCard({ video }) {
  const videoUuid = extractVideoUuid(video);

  return (
    <Link
      to={watchPath(videoUuid)}
      className="group flex flex-col gap-2 rounded-lg border border-stone-200 p-3 transition hover:border-stone-400"
    >
      <div className="relative flex aspect-video items-center justify-center rounded-md bg-stone-900 text-stone-500">
        <svg
          className="h-10 w-10 opacity-60 transition group-hover:opacity-90"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        {video.is18Plus && (
          <span className="absolute right-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            18+
          </span>
        )}
      </div>
      <div>
        <h3 className="line-clamp-1 text-sm font-medium text-stone-900">{video.title}</h3>
        {video.description && (
          <p className="line-clamp-2 text-xs text-stone-500">{video.description}</p>
        )}
      </div>
    </Link>
  );
}