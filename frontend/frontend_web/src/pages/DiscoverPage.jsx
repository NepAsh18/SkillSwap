import { useEffect, useState } from "react";
import SearchBar from "../components/match/SearchBar";
import MatchProfileCard from "../components/match/MatchProfileCard";
import SearchProfileCard from "../components/match/SearchProfileCard";
import ConnectionsList from "../components/match/ConnectionsList";
import { fetchTopMatches, searchUsers } from "../api/discover";
import Navbar from "../components/layout/Navbar";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');`;

const Eyebrow = ({ icon, label, color = '#D4891A', bg = '#FFF3D0', border = '#F5A623' }) => (
  <div
    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
    style={{ background: bg, border: `1px solid ${border}` }}
  >
    <span style={{ fontSize: '0.8rem' }}>{icon}</span>
    <span
      className="text-xs font-semibold tracking-wide uppercase"
      style={{ color, fontFamily: 'Inter, sans-serif' }}
    >
      {label}
    </span>
  </div>
);

const SectionSkeletonGrid = ({ count = 3 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E4D8',
          borderRadius: 18,
          height: 180,
          animation: 'discover-pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.12}s`,
        }}
      />
    ))}
  </div>
);

const EmptyState = ({ icon, title, body }) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '1.5px dashed #E8E4D8',
      borderRadius: 18,
      padding: '32px 24px',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1A1A2E', marginBottom: 4 }}>
      {title}
    </div>
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: '#7A7A9A', maxWidth: 380, margin: '0 auto' }}>
      {body}
    </div>
  </div>
);

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
    <div style={{ background: '#FFFBF0', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>{FONT_IMPORT}</style>
      <style>{`
        @keyframes discover-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
      `}</style>

      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-12 pb-4">
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', color: '#1A1A2E',
          letterSpacing: '-0.02em', marginBottom: 6,
        }}>
          Discover people to swap skills with
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.92rem', color: '#7A7A9A', marginBottom: 24 }}>
          Matched from what you know and what you want to learn.
        </p>

        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        {searchResults !== null ? (
          <SearchSection title={`Results (${searchResults.length})`} users={searchResults} loading={false} />
        ) : loadError ? (
          <div className="mt-6">
            <EmptyState
              icon="⚠️"
              title="Couldn't load matches"
              body="Something went wrong reaching the matching service — please try again shortly."
            />
          </div>
        ) : (
          <>
            {coldStart && !loading && (
              <div
                className="mt-2 mb-6"
                style={{
                  background: '#FFF3D0', border: '1px solid #F5A623',
                  borderRadius: 14, padding: '12px 18px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ fontSize: '1rem' }}>💡</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#D4891A' }}>
                  Add skills you'd like to learn to your profile for better matches — for now,
                  here are some popular people on the platform.
                </span>
              </div>
            )}
            <MatchSection
              title="Top matches for you"
              eyebrowIcon="🎯"
              eyebrowLabel="Ranked for you"
              users={topMatches}
              loading={loading}
              emptyIcon="🔍"
              emptyTitle="No top matches yet"
              emptyBody="Complete your profile's skills so we can find people who complement them."
            />
            {(loading || adjacent.length > 0) && (
              <MatchSection
                title="You might also like"
                eyebrowIcon="✨"
                eyebrowLabel="Recommended"
                users={adjacent}
                loading={false}
                emptyIcon="✨"
                emptyTitle="Nothing here yet"
                emptyBody="Recommendations based on related skills will show up as more people join."
              />
            )}
          </>
        )}

        <div className="mt-10 pt-8" style={{ borderTop: '1px solid #E8E4D8' }}>
          <Eyebrow icon="🤝" label="Your network" color="#2196F3" bg="#E3F2FD" border="#2196F3" />
          <ConnectionsList />
        </div>
      </div>
    </div>
  );
}

function MatchSection({ title, eyebrowIcon, eyebrowLabel, users, loading, emptyIcon, emptyTitle, emptyBody }) {
  return (
    <section className="mt-8">
      {eyebrowLabel && <Eyebrow icon={eyebrowIcon} label={eyebrowLabel} />}
      <h2 style={{
        fontFamily: 'Sora, sans-serif', fontWeight: 700,
        fontSize: '1.15rem', color: '#1A1A2E', marginBottom: 14,
      }}>
        {title}
      </h2>
      {loading ? (
        <SectionSkeletonGrid />
      ) : users.length === 0 ? (
        <EmptyState icon={emptyIcon || '🔍'} title={emptyTitle || 'No matches yet'} body={emptyBody || 'Try a different search.'} />
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
      <h2 style={{
        fontFamily: 'Sora, sans-serif', fontWeight: 700,
        fontSize: '1.15rem', color: '#1A1A2E', marginBottom: 14,
      }}>
        {title}
      </h2>
      {loading ? (
        <SectionSkeletonGrid />
      ) : users.length === 0 ? (
        <EmptyState icon="🔍" title="No matches yet" body="Try a different search term or spelling." />
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