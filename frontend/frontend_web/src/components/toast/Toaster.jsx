/**
 * components/toast/Toaster.jsx
 *
 * Custom react-hot-toast renderer with Framer Motion enter/exit.
 *
 * Usage (add once in AuthLayout or App.jsx):
 *   <AppToaster />
 *
 * Trigger anywhere:
 *   import toast from "react-hot-toast";
 *   toast.success("Logged in!");
 *   toast.error("Invalid credentials.");
 *   toast("Loading…");
 */

import { Toaster, resolveValue } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { TOAST_VARIANTS } from "../../animation/framerMotion";

// ─── Icon map ──────────────────────────────────────────────────────────────
const ICONS = {
  success: (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
      ✓
    </span>
  ),
  error: (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-500 text-xs font-bold">
      ✕
    </span>
  ),
  loading: (
    <span className="flex h-5 w-5 items-center justify-center">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="block h-4 w-4 rounded-full border-2 border-gray-200 border-t-gray-700"
      />
    </span>
  ),
};

// ─── Border accent colours by type ────────────────────────────────────────
const BORDER = {
  success: "border-l-emerald-500",
  error:   "border-l-red-400",
  loading: "border-l-brand-500",
  blank:   "border-l-gray-300",
};

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      toastOptions={{ duration: 3500 }}
    >
      {(t) => (
        <AnimatePresence>
          {t.visible && (
            <motion.div
              key={t.id}
              variants={TOAST_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className={[
                "flex items-start gap-3 min-w-[280px] max-w-sm",
                "rounded-xl border border-gray-100 border-l-4 bg-white",
                "px-4 py-3 shadow-lg shadow-gray-200/60",
                BORDER[t.type] ?? BORDER.blank,
              ].join(" ")}
              role="status"
              aria-live="polite"
            >
              {/* Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {ICONS[t.type] ?? null}
              </div>

              {/* Message */}
              <p className="text-sm font-medium text-gray-800 leading-snug">
                {resolveValue(t.message, t)}
              </p>

              {/* Dismiss */}
              <button
                onClick={() => import("react-hot-toast").then(({ default: ht }) => ht.dismiss(t.id))}
                className="ml-auto flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Toaster>
  );
}