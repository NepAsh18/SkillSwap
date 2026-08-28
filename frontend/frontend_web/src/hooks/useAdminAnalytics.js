import { useCallback, useEffect, useState } from 'react';
import {adminAnalyticsService} from '../api/admin';

const useAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await adminAnalyticsService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      setError(
        err?.response?.data?.message ||
        'Failed to load analytics.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
};

export default useAdminAnalytics;