import React from 'react';
import RoleBadgeSelect from './RoleBadgeSelect';

const tierTone = {
  NOVICE: 'bg-slate-50 text-slate-600 border-slate-200',
  APPRENTICE: 'bg-sky-50 text-sky-700 border-sky-100',
  PRACTITIONER: 'bg-teal-50 text-teal-700 border-teal-100',
  EXPERT: 'bg-violet-50 text-violet-700 border-violet-100',
  MASTER: 'bg-amber-50 text-amber-700 border-amber-100'
};

const SortHeader = ({ field, label, sortBy, sortDir, onSort, className = '' }) => {
  const active = sortBy === field;
  return (
    <th
      scope="col"
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-800 transition-colors ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (
          <span className="text-indigo-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );
};

const BadgeList = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return <span className="text-xs text-slate-400 italic">No badges</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5 max-w-[220px]">
      {badges.map((b, i) => (
        <span
          key={`${b.skill}-${i}`}
          title={`${b.skill} — Level ${b.currentLevel}`}
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${tierTone[b.tier] ?? tierTone.NOVICE}`}
        >
          {b.skill} · L{b.currentLevel}
        </span>
      ))}
    </div>
  );
};

const UserTable = ({ users, sortBy, sortDir, onSort, onRoleChange, updatingUserId }) => {
  if (users.length === 0) {
    return (
      <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
        <p className="text-sm font-medium text-slate-700">No users match these filters</p>
        <p className="text-xs text-slate-400 mt-0.5">Try clearing search, role, tier, or level filters.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <SortHeader field="name" label="Name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            Email
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            Skills
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            Badges
          </th>
          <SortHeader field="createdAt" label="Joined" sortBy={sortBy} sortDir={sortDir} onSort={onSort} className="hidden md:table-cell" />
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            Role
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-800">{u.name}</p>
              {u.username && <p className="text-xs text-slate-400 font-mono">@{u.username}</p>}
            </td>
            <td className="px-4 py-3 text-slate-600">{u.email}</td>
            <td className="px-4 py-3">
              <div className="text-xs text-slate-500 space-y-0.5 max-w-[200px]">
                {u.skillsProficient && (
                  <p className="truncate"><span className="text-slate-400">Has:</span> {u.skillsProficient}</p>
                )}
                {u.skillsToLearn && (
                  <p className="truncate"><span className="text-slate-400">Wants:</span> {u.skillsToLearn}</p>
                )}
                {!u.skillsProficient && !u.skillsToLearn && (
                  <span className="italic text-slate-300">—</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3">
              <BadgeList badges={u.badges} />
            </td>
            <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
            </td>
            <td className="px-4 py-3">
              <RoleBadgeSelect
                userId={u.id}
                currentRoles={u.roles}
                isUpdating={updatingUserId === u.id}
                onChange={onRoleChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;