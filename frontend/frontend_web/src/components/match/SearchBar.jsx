import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { autocomplete } from "../../api/discover";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await autocomplete(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query);
  };

  return (
    <div className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search skills, people, anything you want to learn…"
          className="w-full bg-surface text-ink placeholder:text-muted rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-learn"
        />
      </form>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute mt-1 w-full bg-surface rounded-xl shadow-xl shadow-black/30 overflow-hidden z-30"
          >
            {suggestions.map((s) => (
              <li key={s.userId}>
                <button
                  type="button"
                  onMouseDown={() => {
                    setQuery(s.name);
                    setShowSuggestions(false);
                    onSearch(s.name);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-ink/5 transition-colors flex items-center gap-2"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted text-xs">@{s.username}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
