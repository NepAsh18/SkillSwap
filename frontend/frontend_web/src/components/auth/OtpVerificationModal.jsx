/**
 * components/auth/OtpVerificationModal.jsx
 *
 * Blurred-backdrop partial page for OTP verification. Shown by both
 * LoginPage and SignupPage whenever the backend returns a PreAuthResponse
 * instead of real tokens.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { verifyOtp } from "../../api/authService";
import { getFriendlyAuthError } from "../../utils/authErrorMessages";

const CODE_LENGTH = 6;

export default function OtpVerificationModal({
  open,
  preAuthToken,
  expiresInSeconds = 600,
  message,
  onClose,
  onVerified,
  onResend,
}) {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds);
  const [resending, setResending] = useState(false);
  const [currentToken, setCurrentToken] = useState(preAuthToken);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (open) {
      setDigits(Array(CODE_LENGTH).fill(""));
      setSecondsLeft(expiresInSeconds);
      setCurrentToken(preAuthToken);
      const t = setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, preAuthToken, expiresInSeconds]);

  useEffect(() => {
    if (!open || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, secondsLeft]);

  const handleChange = (index, value) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });

    if (clean && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setDigits(next);
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const code = digits.join("");

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (code.length !== CODE_LENGTH || submitting) return;

      setSubmitting(true);
      try {
        const authResponse = await verifyOtp({ preAuthToken: currentToken, code });
        toast.success("Verified! Logging you in…");
        onVerified(authResponse);
      } catch (err) {
        toast.error(getFriendlyAuthError(err));
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [code, currentToken, submitting, onVerified]
  );

  useEffect(() => {
    if (code.length === CODE_LENGTH && !submitting) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleResend = async () => {
    if (resending || !onResend) return;
    setResending(true);
    try {
      const fresh = await onResend();
      if (fresh?.preAuthToken) {
        setCurrentToken(fresh.preAuthToken);
        setSecondsLeft(fresh.expiresInSeconds ?? expiresInSeconds);
      }
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      toast.success("A new code has been sent to your email.");
    } catch (err) {
      toast.error(getFriendlyAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft <= 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={submitting ? undefined : onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white p-7 shadow-2xl"
          >
            <div className="flex justify-end mb-2 text-xl font-bold text-gray-900 tracking-tight">
              ✦
            </div>

            <h2 className="text-[20px] font-bold text-gray-900 mb-1 leading-tight">
              Verify your identity
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {message || "Enter the 6-digit code we emailed you"}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="flex justify-between gap-2 mb-5" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    disabled={submitting || expired}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={[
                      "w-11 h-13 py-2 text-center text-lg font-semibold rounded-xl border",
                      "focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400",
                      "transition-colors duration-150",
                      digit ? "border-gray-400 bg-gray-50" : "border-gray-200",
                      (submitting || expired) && "opacity-50 cursor-not-allowed",
                    ].join(" ")}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-5">
                <span>
                  {expired ? (
                    <span className="text-red-500 font-medium">Code expired</span>
                  ) : (
                    <>Expires in <span className="font-medium text-gray-600">{mm}:{ss}</span></>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={submitting || code.length !== CODE_LENGTH || expired}
                whileTap={{ scale: 0.97 }}
                className={[
                  "w-full rounded-xl py-3 text-sm font-semibold text-white",
                  "transition-all duration-200",
                  submitting
                    ? "bg-gray-500 cursor-not-allowed"
                    : code.length === CODE_LENGTH && !expired
                    ? "bg-gray-900 hover:bg-gray-700"
                    : "bg-gray-300 cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "Verifying…" : "Verify"}
              </motion.button>
            </form>

            <button
              type="button"
              onClick={submitting ? undefined : onClose}
              className="mt-5 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}