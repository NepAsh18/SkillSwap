/**
 * hooks/useAuthForm.js
 *
 * Centralises all animation-trigger state so pages stay declarative.
 *
 * Returns:
 *   activeField    "email" | "password" | "name" | null
 *   submitState    "idle" | "loading" | "success" | "error"
 *   fieldProps(name) → { onFocus, onBlur } — merge into input registrations
 *   triggerSubmit(asyncFn) → wraps any async auth call with full lifecycle
 */

import { useState, useCallback } from "react";

export function useAuthForm() {
  const [activeField, setActiveField] = useState(null);
  const [submitState, setSubmitState] = useState("idle");

  const fieldProps = useCallback(
    (name) => ({
      onFocus: () => setActiveField(name),
      onBlur:  () => setActiveField(null),
    }),
    []
  );

  const triggerSubmit = useCallback(async (asyncFn) => {
    setSubmitState("loading");
    try {
      await asyncFn();
      setSubmitState("success");
      setTimeout(() => setSubmitState("idle"), 1800);
    } catch {
      setSubmitState("error");
      setTimeout(() => setSubmitState("idle"), 700);
    }
  }, []);

  return { activeField, submitState, fieldProps, triggerSubmit };
}