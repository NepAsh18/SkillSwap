import { useEffect, useState, useCallback } from "react";
import { getMyPlaylists, createPlaylist } from "../../api/user/playlists";
import PlaylistCard from "../../components/playlist/PlaylistCard";
import PlaylistForm from "../../components/playlist/PlaylistForm";
import Spinner from "../../components/common/Spinner";
import ErrorBanner from "../../components/common/ErrorBanner";
import EmptyState from "../../components/common/EmptyState";

/**
 * ASSUMPTION: useAuth() exposes the logged-in user's id, matching whatever
 * your existing AuthContext/login flow provides. Swap the import below to
 * match your actual hook if the name or shape differs.
 */
import { useAuth } from "../../hooks/useAuth";

export default function PlaylistsPage() {
  const { user } = useAuth();
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

  const dummyVideos = []; 

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-10">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Playlist Header */}
        <div className="bg-slate-800 rounded-2xl p-8 mb-10 border-l-4 border-teal-400 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -mt-20 -mr-20 blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-teal-300">My Awesome Playlist</h1>
            <p className="text-slate-400 mt-2 font-medium">12 Videos • Updated yesterday</p>
            <p className="text-slate-400 text-sm mt-4 max-w-2xl">
              A collection of the best videos in this category. Browse below or start watching from the beginning.
            </p>
            
            <button className="mt-6 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2.5 px-8 rounded-full transition-colors shadow-lg shadow-teal-500/20">
              Play All
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="border-t border-slate-800 pt-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Videos in this playlist</h2>
          <VideoGrid videos={dummyVideos} />
        </div>
        
      </div>
    </div>
  );
}