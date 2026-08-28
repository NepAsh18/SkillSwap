import React, { useState, useEffect } from 'react';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import UserFilterBar from '../../components/admin/UserFilterBar';
import UserTable from '../../components/admin/UserTable';
import Pagination from '../../components/admin/Pagination';
import Spinner from '../../components/common/Spinner';
import ErrorBanner from '../../components/common/ErrorBanner';

const AdminUserPage = () => {
  const {
    users,
    pageInfo,
    isLoading,
    error,
    refetch,
    search, setSearch,
    role, setRole,
    tier, setTier,
    level, setLevel,
    sortBy, sortDir, toggleSort,
    setPage,
    updateUserRole,
    updatingUserId,
    roleError
  } = useAdminUsers();

  // Local input state so typing doesn't trigger a fetch on every keystroke —
  // the hook debounces internally, but we still want a snappy input field.
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasActiveFilters = Boolean(search || role || tier || level);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setRole('');
    setTier('');
    setLevel('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">User management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Search, filter, and manage roles across your user base.
          </p>
        </div>
        <button
          onClick={refetch}
          className="self-start sm:self-center px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all"
        >
          Refresh
        </button>
      </div>

      {roleError && (
        <div className="mb-4">
          <ErrorBanner
            error={roleError}
            message="Could not update this user's role. Please try again."
          />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="mb-5">
          <UserFilterBar
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            role={role}
            onRoleChange={setRole}
            tier={tier}
            onTierChange={setTier}
            level={level}
            onLevelChange={setLevel}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {isLoading && (
          <div className="py-16 flex justify-center">
            <Spinner label="Loading users" />
          </div>
        )}

        {!isLoading && error && (
          <ErrorBanner error={error} onRetry={refetch} />
        )}

        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto -mx-6 px-6">
              <UserTable
                users={users}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={toggleSort}
                onRoleChange={updateUserRole}
                updatingUserId={updatingUserId}
              />
            </div>
            <Pagination pageInfo={pageInfo} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUserPage;