import { useState, useEffect, useCallback, useRef } from 'react';
import { adminUserService } from '../api/admin';

const DEFAULT_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

export function useAdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [tier, setTier] = useState('');
  const [level, setLevel] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [size] = useState(DEFAULT_SIZE);

  const [data, setData] = useState({
    content: [],
    page: 0,
    size: DEFAULT_SIZE,
    totalElements: 0,
    totalPages: 0,
    last: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [roleError, setRoleError] = useState(null);

  const debounceRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminUserService.searchUsers({
        search, role, tier, level: level === '' ? undefined : level,
        page, size, sortBy, sortDir
      });
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, role, tier, level, page, size, sortBy, sortDir]);

  // Debounce only the search-driven refetch so typing doesn't hammer the API
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, tier, level, page, sortBy, sortDir]);

  // Reset to first page whenever a filter (not page itself) changes
  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const updateUserRole = async (userId, roleId) => {
    setUpdatingUserId(userId);
    setRoleError(null);
    try {
      await adminUserService.updateUserRole(userId, roleId);
      await fetchUsers();
      return true;
    } catch (err) {
      setRoleError(err);
      return false;
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  return {
    // data
    users: data.content,
    pageInfo: {
      page: data.page,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      last: data.last
    },
    isLoading,
    error,
    refetch: fetchUsers,

    // filters
    search, setSearch: updateFilter(setSearch),
    role, setRole: updateFilter(setRole),
    tier, setTier: updateFilter(setTier),
    level, setLevel: updateFilter(setLevel),
    sortBy, sortDir, toggleSort,

    // pagination
    page, setPage,

    // role mutation
    updateUserRole,
    updatingUserId,
    roleError
  };
}

export default useAdminUsers;