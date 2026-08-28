import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getMyPlaylists, createPlaylist } from "../../api/user/playlists";
import Spinner from "../../components/common/Spinner";
import ErrorBanner from "../../components/common/ErrorBanner";
import EmptyState from "../../components/common/EmptyState";

function PlaylistCard({ playlist }) {
  const count = playlist.videos?.length ?? 0;
  const cover = playlist.videos?.[0]?.video?.thumbnailUrl;
  const firstVideoUuid = playlist.videos?.[0]?.video?.videoUuid;

  return (
    <Link
      to={firstVideoUuid ? `/watch/${firstVideoUuid}?playlistId=${playlist.id}` : "#"}
      className="group flex flex-col rounded-2xl border border-[#E8E4D8] bg-white overflow-hidden shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="relative aspect-video bg-[#1A1A2E] flex items-center justify-center">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="w-full h-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <svg className="w-10 h-10 text-[#7A7A9A]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
          {count} {count === 1 ? "video" : "videos"}
        </span>
        {playlist.isPrivate && (
          <span className="absolute top-2 left-2 bg-[#1A1A2E]/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
            Private
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-['Sora'] font-bold text-[#1A1A2E] text-sm line-clamp-1">
          {playlist.name}
        </h3>
      </div>
    </Link>
  );
}

function CreatePlaylistForm({ onSubmit, isSubmitting }) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), isPrivate });
    setName("");
    setIsPrivate(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-[#E8E4D8] bg-white p-4 shadow-sm"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New playlist name"
        className="flex-1 rounded-lg border border-[#E8E4D8] px-3 py-2 text-sm text-[#1A1A2E] placeholder:text-[#B0ADBE] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
      />
      <label className="flex items-center gap-2 text-sm text-[#5A5A7A] px-1">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="rounded border-[#E8E4D8] text-[#F5A623] focus:ring-[#F5A623]/40"
        />
        Private
      </label>
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="rounded-lg bg-[#F5A623] hover:bg-[#E0951A] text-[#1A1A2E] font-semibold text-sm px-5 py-2 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Creating…" : "Create"}
      </button>
    </form>
  );
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyPlaylists();
      setPlaylists(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleCreate(payload) {
    setIsSubmitting(true);
    try {
      await createPlaylist(payload);
      await refetch();
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] py-10">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="font-['Sora'] font-extrabold text-2xl text-[#1A1A2E]">Your playlists</h1>
        <p className="text-sm text-[#7A7A9A] mt-1">
          Organize videos into collections you can pick up later.
        </p>

        <div className="mt-6">
          <CreatePlaylistForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
        </div>

        <div className="mt-8">
          {isLoading && <Spinner label="Loading playlists" />}
          {error && <ErrorBanner error={error} onRetry={refetch} />}

          {!isLoading && !error && playlists.length === 0 && (
            <EmptyState
              title="No playlists yet"
              description="Create one above to start organizing videos."
            />
          )}

          {!isLoading && !error && playlists.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {playlists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}