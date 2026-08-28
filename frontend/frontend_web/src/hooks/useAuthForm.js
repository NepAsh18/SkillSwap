import { useState, useCallback, useRef } from "react";

export function useAuthForm() {
  const [activeField, setActiveField] = useState(null);
  const [submitState, setSubmitState] = useState("idle");
  const isSubmittingRef = useRef(false);

  const fieldProps = useCallback(
    (name) => ({
      onFocus: () => setActiveField(name),
      onBlur:  () => setActiveField(null),
    }),
    []
  );

  const triggerSubmit = useCallback(async (asyncFn) => {
    // Re-entrancy guard: ignore any call that arrives while one is already
    // in flight. Using a ref instead of submitState avoids the stale-closure
    // window where the button's `disabled` prop hasn't re-rendered yet.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setSubmitState("loading");
    try {
      await asyncFn();
      setSubmitState("success");
      setTimeout(() => setSubmitState("idle"), 1800);
    } catch {
      setSubmitState("error");
      setTimeout(() => setSubmitState("idle"), 700);
    } finally {
      isSubmittingRef.current = false;
    }
  }, []);

  return { activeField, submitState, fieldProps, triggerSubmit };
}