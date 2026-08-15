import { useCallback, useState } from "react";
import { verifyAge } from "../api/user/videos";

/**
 * useAgeVerification — wraps the ZK proof submission.
 *
 * NOTE: actual ZK proof generation is a client-side circuit that runs
 * separately (per the backend's documented contract — the server only
 * hashes whatever string it receives). Wire your real proof generator
 * into onVerify() in AgeGateModal.jsx; this hook just submits the result.
 */
export function useAgeVerification() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitProof = useCallback(async (zkProof) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await verifyAge(zkProof);
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitProof, isSubmitting, error };
}