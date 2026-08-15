import { useEffect, useState, useCallback } from "react";
import { getUserPlaylists, createPlaylist } from "../../api/committee/playlists";
import PlaylistCard from "../../components/playlist/PlaylistCard";
import PlaylistForm from "../../components/playlist/PlaylistForm";
import Spinner from "../../components/common/Spinner";
import ErrorBanner from "../../components/common/ErrorBanner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-stone-900">Manage playlists</h1>

      <div className="mt-6">
        <PlaylistForm userId={user?.id} onSubmit={handleCreate} isSubmitting={isSubmitting} />
      </div>

      <div className="mt-8">
        {isLoading && <Spinner label="Loading playlists" />}
        {error && <ErrorBanner error={error} onRetry={refetch} />}
        {!isLoading && !error && playlists.length === 0 && (
          <EmptyState title="No playlists yet" description="Create one above to get started." />
        )}
        {!isLoading && !error && playlists.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}