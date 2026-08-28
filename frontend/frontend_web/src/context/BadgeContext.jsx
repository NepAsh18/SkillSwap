import React, { createContext, useContext, useState, useCallback } from 'react';
import { getUserBadges } from '../api/badgeService';
import { getMyProfile } from '../api/profileService';

const BadgeContext = createContext(null);

// Given the array of per-skill badges the backend returns, pick the one to
// show as "your badge" on the home hero. There's no timestamp field, so we
// treat "most sessions completed" (tie-broken by highest level) as the best
// proxy for the user's primary/most-invested skill.
const pickPrimaryBadge = (badges) => {
  if (!Array.isArray(badges) || badges.length === 0) return null;
  return badges.reduce((best, b) => {
    if (!best) return b;
    const bestSessions = best.sessionsCompleted ?? 0;
    const sessions = b.sessionsCompleted ?? 0;
    if (sessions > bestSessions) return b;
    if (sessions === bestSessions && (b.currentLevel ?? 0) > (best.currentLevel ?? 0)) return b;
    return best;
  }, null);
};

export const BadgeProvider = ({ children }) => {
  // No localStorage hydration -- the backend is the source of truth.
  // Badge state starts empty every page load and is fetched on demand.
  const [latestBadge, setLatestBadge] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [badgeLoading, setBadgeLoading] = useState(false);

  // Called right after finishing an assessment -- this is the ONLY path that
  // should pop the "Badge Earned!" popup.
  const saveBadge = (badge) => {
    setLatestBadge(badge);
    setShowPopup(true);
  };

  // Called on logout, or when there's no session -- clears in-memory state
  // only, nothing to remove from localStorage anymore.
  const clearBadge = () => {
    setLatestBadge(null);
    setShowPopup(false);
  };

  // Fire-and-forget background sync: call this after login succeeds, or on
  // app mount if a token already exists. It must never be awaited by a
  // login/navigation flow -- badge data is supplementary, not a login gate.
  const loadBadge = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearBadge();
      return;
    }

    setBadgeLoading(true);
    try {
      const profile = await getMyProfile();
      const userId = profile?.id ?? profile?.userId;
      if (!userId) {
        clearBadge();
        return;
      }

      const badges = await getUserBadges(userId);
      const primary = pickPrimaryBadge(badges);

      // Silent sync -- do NOT open the popup here, only saveBadge() should.
      setLatestBadge(primary ?? null);
    } catch (err) {
      // A brand-new user with no assessments yet, or a transient failure --
      // either way this should never break login or the rest of the app.
      console.error('Failed to load badge:', err.response?.data || err.message);
      setLatestBadge(null);
    } finally {
      setBadgeLoading(false);
    }
  }, []);

  const dismissPopup = () => setShowPopup(false);

  return (
    <BadgeContext.Provider value={{
      latestBadge,
      showPopup,
      badgeLoading,
      saveBadge,
      clearBadge,
      dismissPopup,
      loadBadge,
    }}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadge = () => {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error('useBadge must be used within BadgeProvider');
  return ctx;
};