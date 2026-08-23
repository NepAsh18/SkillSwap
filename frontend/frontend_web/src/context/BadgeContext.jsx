import React, { createContext, useContext, useState } from 'react';

const BadgeContext = createContext(null);

export const BadgeProvider = ({ children }) => {
  const [latestBadge, setLatestBadge] = useState(() => {
    try {
      // Only hydrate from storage if a session actually exists
      const token = localStorage.getItem('token');
      if (!token) return null;

      const stored = localStorage.getItem('skillswap_badge');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [showPopup, setShowPopup] = useState(false);

  const saveBadge = (badge) => {
    setLatestBadge(badge);
    setShowPopup(true);
    try {
      localStorage.setItem('skillswap_badge', JSON.stringify(badge));
    } catch { }
  };

  const clearBadge = () => {
    setLatestBadge(null);
    setShowPopup(false);
    try {
      localStorage.removeItem('skillswap_badge');
    } catch { }
  };

  const dismissPopup = () => setShowPopup(false);

  return (
    <BadgeContext.Provider value={{ latestBadge, showPopup, saveBadge, clearBadge, dismissPopup }}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadge = () => {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error('useBadge must be used within BadgeProvider');
  return ctx;
};