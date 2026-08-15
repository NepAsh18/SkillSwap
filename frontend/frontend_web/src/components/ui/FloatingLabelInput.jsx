/**
 * components/ui/FloatingLabelInput.jsx
 *
 * Accessible input with Framer Motion floating label.
 * Forwards ref for react-hook-form register() compatibility.
 *
 * Props:
 *   label   string   — visible label text
 *   error   string?  — validation error from react-hook-form
 *   type    string   — input type (default "text")
 *   suffix  node?    — right-side slot (show/hide toggle, icon, etc.)
 *   id      string?  — explicit id; derived from label if omitted
 *   All other props forwarded to <input>
 */

import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LABEL_LIFTED, LABEL_RESTING, LABEL_SPRING,
  FIELD_ERROR_VARIANTS,
} from "../../animation/framerMotion";

const FloatingLabelInput = forwardRef(function FloatingLabelInput(
  { label, error, type = "text", suffix, id, className = "", ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const inputId  = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const hasValue = Boolean(rest.value ?? rest.defaultValue);
  const isLifted = focused || hasValue;

  return (
    <div className="relative">
      {/* ── Input ── */}
      <input
        ref={ref}
        id={inputId}
        type={type}
        placeholder=" "
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={[
          "peer w-full rounded-xl border bg-white px-4 pt-6 pb-2",
          "text-sm text-gray-900 outline-none",
          "transition-all duration-200",
          error
            ? "border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          suffix ? "pr-11" : "",
          className,
        ].filter(Boolean).join(" ")}
        onFocus={(e) => { setFocused(true);  rest.onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); rest.onBlur?.(e);  }}
        {...rest}
      />

      {/* ── Floating label ── */}
      <motion.label
        htmlFor={inputId}
        animate={isLifted ? LABEL_LIFTED : LABEL_RESTING}
        transition={LABEL_SPRING}
        className={[
          "pointer-events-none absolute left-4 font-medium select-none",
          focused || error
            ? error ? "text-red-400" : "text-brand-500"
            : "text-gray-400",
        ].join(" ")}
        style={{ fontSize: 14, top: 16 }}
      >
        {label}
      </motion.label>

      {/* ── Right suffix slot ── */}
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {suffix}
        </div>
      )}

      {/* ── Validation error ── */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${inputId}-error`}
            role="alert"
            variants={FIELD_ERROR_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mt-1 text-xs font-medium text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

export default FloatingLabelInput;