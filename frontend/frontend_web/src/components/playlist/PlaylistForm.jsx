import { useState } from "react";

/**
 * PlaylistForm — shared shape for both user and committee playlist creation.
 * Pass `userId` explicitly since CreatePlaylistRequestDTO requires it.
 */
export default function PlaylistForm({ userId, onSubmit, isSubmitting }) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ userId, name, isPrivate });
    setName("");
    setIsPrivate(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="playlist-name">
          New playlist
        </label>
        <input
          id="playlist-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
      </div>
      <label className="mb-2 flex items-center gap-1.5 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300"
        />
        Private
      </label>
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
      >
        Create
      </button>
    </form>
  );
}