import { Link } from "react-router-dom";
import { watchPath } from "../../constants/routes";
import { extractVideoUuid } from "../../utils/video";

export default function VideoCard({ video }) {
  const videoUuid = extractVideoUuid(video);

  return (
    <Link
      to={watchPath(videoUuid)}
      className="group flex flex-col gap-2 rounded-xl border border-[#E8E4D8] bg-white p-3 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-[#1A1A2E]">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <svg
            className="h-10 w-10 text-[#7A7A9A] opacity-60 transition group-hover:opacity-90"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        {video.is18Plus && (
          <span className="absolute right-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            18+
          </span>
        )}
      </div>
      <div>
        <h3 className="line-clamp-1 text-sm font-semibold text-[#1A1A2E]">{video.title}</h3>
        {video.description && (
          <p className="line-clamp-2 text-xs text-[#7A7A9A] mt-0.5">{video.description}</p>
        )}
      </div>
    </Link>
  );
}