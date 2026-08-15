import { useCallback, useState } from "react";
import {
  getAgeVerificationStatus,
  revokeAgeVerification,
} from "../api/admin/ageVerification";

/**
 * useAdminAgeVerification — backs AgeVerificationAdminPage.jsx.
 * Admin types in a userId, looks up status, optionally revokes.
 */
export function useAdminAgeVerification() {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState(null);

  const lookup = useCallback(async (userId) => {
    setIsLoading(true);
    setError(null);
    setStatus(null);
    try {
      const data = await getAgeVerificationStatus(userId);
      setStatus(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revoke = useCallback(async (userId) => {
    setIsRevoking(true);
    setError(null);
    try {
      await revokeAgeVerification(userId);
      setStatus((prev) => (prev ? { ...prev, isVerified: false } : prev));
    } catch (err) {
      setError(err);
    } finally {
      setIsRevoking(false);
    }
  }, []);

  return { status, isLoading, isRevoking, error, lookup, revoke };
}