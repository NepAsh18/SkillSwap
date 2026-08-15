import VideoCard from "./VideoCard";
import EmptyState from "../common/EmptyState";

export default function VideoGrid({ videos }) {
  if (videos.length === 0) {
    return (
      <EmptyState
        title="No videos yet"
        description="Once the committee uploads content, it'll show up here."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}