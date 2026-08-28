import React, { useState } from 'react';

// Static role catalogue — id must match your `roles` table exactly.
// (Swap this for a fetched list if roles ever become dynamic/admin-managed.)
export const ROLE_CATALOGUE = [
  { id: '07e322f1-c5be-4520-b7cc-ba9bb5384920', name: 'ROLE_USER', label: 'User' },
  { id: 'af538064-b08a-4418-8df3-0ece879909d1', name: 'ROLE_ADMIN', label: 'Admin' },
  { id: '83ec038f-56ad-4b65-8715-0cac8ba6b9d6', name: 'ROLE_COMMITTEE_MEMBER', label: 'Committee member' }
];

const roleTone = {
  ROLE_ADMIN: 'bg-red-50 text-red-700 border-red-100',
  ROLE_COMMITTEE_MEMBER: 'bg-amber-50 text-amber-700 border-amber-100',
  ROLE_USER: 'bg-slate-50 text-slate-600 border-slate-200'
};

const RoleBadgeSelect = ({ userId, currentRoles, isUpdating, onChange }) => {
  const [pendingRoleId, setPendingRoleId] = useState(null);

  const currentRoleName = currentRoles?.[0] ?? 'ROLE_USER';
  const currentRoleEntry = ROLE_CATALOGUE.find((r) => r.name === currentRoleName);

  const handleSelect = (e) => {
    const roleId = e.target.value;
    if (!roleId || roleId === currentRoleEntry?.id) return;

    const target = ROLE_CATALOGUE.find((r) => r.id === roleId);
    const confirmed = window.confirm(
      `Change this user's role to "${target?.label}"? This replaces their current role.`
    );
    if (!confirmed) {
      e.target.value = currentRoleEntry?.id ?? '';
      return;
    }

    setPendingRoleId(roleId);
    onChange(userId, roleId).finally(() => setPendingRoleId(null));
  };

  const busy = isUpdating || pendingRoleId !== null;
  const tone = roleTone[currentRoleName] ?? roleTone.ROLE_USER;

  return (
    <div className="flex items-center gap-2">
      <span className={`hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${tone}`}>
        {currentRoleEntry?.label ?? currentRoleName}
      </span>
      <select
        value={currentRoleEntry?.id ?? ''}
        onChange={handleSelect}
        disabled={busy}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 disabled:opacity-50 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {ROLE_CATALOGUE.map((r) => (
          <option key={r.id} value={r.id}>{r.label}</option>
        ))}
      </select>
      {busy && (
        <span className="text-xs text-slate-400 animate-pulse">Saving…</span>
      )}
    </div>
  );
};

export default RoleBadgeSelect;