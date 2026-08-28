import React from 'react';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'ROLE_USER', label: 'User' },
  { value: 'ROLE_ADMIN', label: 'Admin' },
  { value: 'ROLE_COMMITTEE_MEMBER', label: 'Committee member' }
];

const TIER_OPTIONS = [
  { value: '', label: 'All tiers' },
  { value: 'NOVICE', label: 'Novice' },
  { value: 'APPRENTICE', label: 'Apprentice' },
  { value: 'PRACTITIONER', label: 'Practitioner' },
  { value: 'EXPERT', label: 'Expert' },
  { value: 'MASTER', label: 'Master' }
];

const LEVEL_OPTIONS = [
  { value: '', label: 'All levels' },
  { value: '1', label: 'Level 1' },
  { value: '2', label: 'Level 2' },
  { value: '3', label: 'Level 3' },
  { value: '4', label: 'Level 4' },
  { value: '5', label: 'Level 5' }
];

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

const UserFilterBar = ({
  searchInput,
  onSearchInputChange,
  role,
  onRoleChange,
  tier,
  onTierChange,
  level,
  onLevelChange,
  onClearFilters,
  hasActiveFilters
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          placeholder="Search by name, username, or email…"
          className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={role} onChange={(e) => onRoleChange(e.target.value)} className={selectClass}>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select value={tier} onChange={(e) => onTierChange(e.target.value)} className={selectClass}>
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select value={level} onChange={(e) => onLevelChange(e.target.value)} className={selectClass}>
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default UserFilterBar;