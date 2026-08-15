import { useEffect, useState } from "react";
import SearchBar from "../components/match/SearchBar";
import MatchProfileCard from "../components/match/MatchProfileCard";
import SearchProfileCard from "../components/match/SearchProfileCard";
import ConnectionsList from "../components/match/ConnectionsList";
import { fetchTopMatches, searchUsers } from "../api/discover";

export default function DiscoverPage() {
  const [topMatches, setTopMatches] = useState([]);
  const [adjacent, setAdjacent] = useState([]);
  const [coldStart, setColdStart] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Backend now returns { topMatches, adjacent, coldStart } directly —
        // no client-side splitting needed, the server already separated
        // exact matches from adjacency-derived recommendations.
        const { topMatches, adjacent, coldStart } = await fetchTopMatches(12);
        setTopMatches(topMatches ?? []);
        setAdjacent(adjacent ?? []);
        setColdStart(Boolean(coldStart));
        setLoadError(false);
      } catch {
        // Backend unreachable — show an explicit error state rather than
        // silently swapping in fake data, so real outages are visible.
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      // searchUsers returns raw UserSearchDocument[] — no finalScore/breakdown,
      // this is full-text search, not ranked matching. ProfileCard must
      // handle both shapes (see below).
      const results = await searchUsers(query);
      setSearchResults(results ?? []);
    } catch {
      setSearchResults([]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <SearchBar onSearch={handleSearch} />

      {searchResults !== null ? (
        <SearchSection title={`Results (${searchResults.length})`} users={searchResults} loading={false} />
      ) : loadError ? (
        <p className="text-surface/60 text-sm mt-8">
          Couldn't load matches right now — please try again shortly.
        </p>
      ) : (
        <>
          {coldStart && !loading && (
            <p className="text-surface/60 text-sm mt-4 mb-2">
              Add skills you'd like to learn to your profile for better matches — for now,
              here are some popular people on the platform.
            </p>
          )}
          <MatchSection title="Top matches for you" users={topMatches} loading={loading} />
          {adjacent.length > 0 && (
            <MatchSection title="You might also like" users={adjacent} loading={false} />
          )}
        </>
      )}

      <ConnectionsList />
    </div>
  );
}

function MatchSection({ title, users, loading }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-surface mb-3">{title}</h2>
      {loading ? (
        <p className="text-surface/60 text-sm">Loading matches…</p>
      ) : users.length === 0 ? (
        <p className="text-surface/60 text-sm">No matches yet — try a different search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <MatchProfileCard key={u.userId} user={u} />
          ))}
        </div>
      )}
    </section>
  );
}

function SearchSection({ title, users, loading }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-surface mb-3">{title}</h2>
      {loading ? (
        <p className="text-surface/60 text-sm">Loading matches…</p>
      ) : users.length === 0 ? (
        <p className="text-surface/60 text-sm">No matches yet — try a different search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <SearchProfileCard key={u.userId} user={u} />
          ))}
        </div>
      )}
    </section>
  );
}