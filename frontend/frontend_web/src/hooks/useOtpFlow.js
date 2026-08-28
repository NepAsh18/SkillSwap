

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useBadge } from "../context/BadgeContext";

function redirectForRole(navigate, primaryRole) {
  switch (primaryRole) {
    case "ROLE_ADMIN":
      navigate("/admin/dashboard", { replace: true });
      break;
    case "ROLE_COMMITTEE":
      navigate("/committee/dashboard", { replace: true });
      break;
    case "ROLE_USER":
      navigate("/dynamicpage", { replace: true });
      break;
    default:
      navigate("/", { replace: true });
  }
}

export function useOtpFlow() {
  const navigate = useNavigate();
  const { loadBadge } = useBadge();

  const [state, setState] = useState({
    isOpen: false,
    preAuthToken: null,
    expiresInSeconds: 600,
    message: "",
    resend: null, // () => Promise<PreAuthResponse>
  });

  const open = useCallback(({ preAuthToken, expiresInSeconds, message, resend }) => {
    setState({
      isOpen: true,
      preAuthToken,
      expiresInSeconds: expiresInSeconds ?? 600,
      message: message ?? "",
      resend: resend ?? null,
    });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  // Called by OtpVerificationModal once verify-otp succeeds with a real AuthResponse
  const handleVerified = useCallback(
    (authResponse) => {
      if (authResponse.accessToken) {
        localStorage.setItem("token", authResponse.accessToken);
      }
      if (authResponse.user?.id) {
        localStorage.setItem("userId", authResponse.user.id);
      }

      const primaryRole = Array.isArray(authResponse.user?.roles)
        ? authResponse.user.roles[0]
        : authResponse.user?.role || "";

      if (primaryRole) {
        localStorage.setItem("role", primaryRole);
      }

      // Background badge sync — deliberately not awaited, same as normal login
      loadBadge();

      close();

      setTimeout(() => {
        redirectForRole(navigate, primaryRole);
      }, 500);
    },
    [close, loadBadge, navigate]
  );

  // Called by OtpVerificationModal's "Resend code" button
  const handleResend = useCallback(async () => {
    if (!state.resend) {
      toast.error("Can't resend right now — please try again from the start.");
      throw new Error("No resend handler configured.");
    }
    const fresh = await state.resend();
    if (!fresh?.preAuthToken) {
      throw new Error("Resend didn't return a new verification session.");
    }
    return fresh;
  }, [state.resend]);

  return {
    open,
    close,
    modalProps: {
      open: state.isOpen,
      preAuthToken: state.preAuthToken,
      expiresInSeconds: state.expiresInSeconds,
      message: state.message,
      onClose: close,
      onVerified: handleVerified,
      onResend: handleResend,
    },
  };
}