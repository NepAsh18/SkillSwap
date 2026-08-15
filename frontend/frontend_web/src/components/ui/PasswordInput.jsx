/**
 * components/ui/PasswordInput.jsx
 *
 * Composes FloatingLabelInput with a show/hide eye-toggle suffix.
 * Forwards ref for react-hook-form compatibility.
 */

import { forwardRef, useState } from "react";
import FloatingLabelInput from "./FloatingLabelInput";

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);

  return (
    <FloatingLabelInput
      ref={ref}
      type={show ? "text" : "password"}
      label="Password"
      suffix={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOpen /> : <EyeClosed />}
        </button>
      }
      {...props}
    />
  );
});

export default PasswordInput;