import { useCallback, useEffect, useState } from "react";
import {
  getAllAccountability,
  getStorageSummary,
} from "../api/admin/accountability";

/**
 * useAccountability — backs AccountabilityPage.jsx.
 * Fetches the full record list and the platform-wide storage summary
 * together since the page renders both.
 */
export function useAccountability() {
  const [records, setRecords] = useState([]);
  const [storage, setStorage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recordsData, storageData] = await Promise.all([
        getAllAccountability(),
        getStorageSummary(),
      ]);
      setRecords(recordsData);
      setStorage(storageData);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { records, storage, isLoading, error, refetch };
}