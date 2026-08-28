import { useEffect, useState, useCallback } from "react";
import { getUserPlaylists, createPlaylist } from "../../api/committee/playlists";
import Navbar from "../../context/Navbar";
import Spinner from "../../components/common/Spinner";
import ErrorBanner from "../../components/common/ErrorBanner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";

function PlaylistRow({ playlist }) {
  const count = playlist.videos?.length ?? 0;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#E8E4D8] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-20 aspect-video rounded-lg bg-[#1A1A2E] flex items-center justify-center shrink-0 overflow-hidden border border-[#E8E4D8]">
        {playlist.videos?.[0]?.video?.thumbnailUrl ? (
          <img
            src={playlist.videos[0].video.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-['Sora'] font-bold text-[0.95rem] text-[#1A1A2E] truncate">
          {playlist.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="rounded-full bg-[#FFF3D0] px-2 py-0.5 text-xs font-bold text-[#D4891A]">
            {count} {count === 1 ? "video" : "videos"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              playlist.isPrivate
                ? "bg-[#F3E5F5] text-[#8B2FA0]"
                : "bg-[#EAF6EF] text-[#2C7A4F]"
            }`}
          >
            {playlist.isPrivate ? "Private" : "Public"}
          </span>
        </div>
      </div>
    </div>
  );
}

function CreatePlaylistForm({ userId, onSubmit, isSubmitting }) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !userId) return;
    onSubmit({ userId, name: name.trim(), isPrivate });
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
        className="flex-1 rounded-lg border border-[#E8E4D8] px-3 py-2 text-sm font-medium text-[#1A1A2E] placeholder:text-[#9A97AE] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
      />
      <label className="flex items-center gap-2 text-sm font-semibold text-[#3A3A5A] px-1">
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
        className="rounded-lg bg-[#F5A623] hover:bg-[#E0951A] text-[#1A1A2E] font-bold text-sm px-5 py-2 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Creating…" : "Create"}
      </button>
    </form>
  );
}

export default function PlaylistManagePage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserPlaylists(user.id);
      setPlaylists(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

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
    <div className="min-h-screen bg-[#FFFBF0]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#F7C45A] flex items-center justify-center text-sm">
            ⚡
          </div>
          <h1 className="font-['Sora'] font-extrabold text-xl text-[#1A1A2E]">
            Manage playlists
          </h1>
        </div>
        <p className="text-sm text-[#5A5A7A] ml-[42px]">
          Create and review playlists for this account.
        </p>

        <div className="mt-6">
          <CreatePlaylistForm userId={user?.id} onSubmit={handleCreate} isSubmitting={isSubmitting} />
        </div>

        <div className="mt-8">
          {isLoading && <Spinner label="Loading playlists" />}
          {error && <ErrorBanner error={error} onRetry={refetch} />}

          {!isLoading && !error && playlists.length === 0 && (
            <EmptyState title="No playlists yet" description="Create one above to get started." />
          )}

          {!isLoading && !error && playlists.length > 0 && (
            <div className="flex flex-col gap-3">
              {playlists.map((p) => (
                <PlaylistRow key={p.id} playlist={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}