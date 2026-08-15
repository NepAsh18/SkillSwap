export const PAGE_VARIANTS = {
  initial: (dir) => ({
    x:       dir * 56,
    opacity: 0,
  }),
  animate: {
    x:       0,
    opacity: 1,
    transition: {
      type:      "spring",
      stiffness: 340,
      damping:   30,
      mass:      0.9,
    },
  },
  exit: (dir) => ({
    x:        dir * -56,
    opacity:  0,
    transition: { duration: 0.16, ease: "easeIn" },
  }),
};

// ─── Character: shared idle float (applied per-character with delay offsets) ─
export const CHAR_IDLE = (delay = 0) => ({
  animate: {
    y: [0, -7, 0],
    transition: {
      duration: 3.2,
      repeat:   Infinity,
      ease:     "easeInOut",
      delay,
    },
  },
});
 
// ─── Character: squash-and-stretch bounce (success) ──────────────────────
export const CHAR_BOUNCE = {
  y:      [0, -26, 0, -12, 0],
  scaleX: [1, 0.88, 1.10, 1],
  scaleY: [1, 1.12, 0.90, 1],
  transition: {
    duration: 0.75,
    times:    [0, 0.28, 0.55, 0.78, 1],
  },
};
 
// ─── Character: horizontal shake (error) ─────────────────────────────────
export const CHAR_SHAKE = {
  x:          [0, -10, 10, -7, 7, 0],
  transition: { duration: 0.45 },
};
 
// ─── Character: Purple rect tilt + pupil shift ───────────────────────────
export const CHAR_PURPLE_LOOK = (isEmail, isPassword) => ({
  rotate: isEmail ? -5 : isPassword ? 5 : 0,
  transition: { type: "spring", stiffness: 280, damping: 20 },
});
 
export const CHAR_PUPIL_X = (isEmail, isPassword) =>
  isEmail ? "38%" : isPassword ? "62%" : "50%";
 
// ─── Character: Black rect shy-peek (slides down when password focused) ──
export const CHAR_BLACK_SHY = (isPasswordFocused) => ({
  y:          isPasswordFocused ? 16 : 0,
  transition: { type: "spring", stiffness: 260, damping: 22 },
});
 
// ─── Character: Yellow blob lean (4th character) ─────────────────────────
export const CHAR_YELLOW_LEAN = (isAnyFocused) => ({
  rotate:     isAnyFocused ? -4 : 0,
  transition: { type: "spring", stiffness: 300, damping: 18 },
});
 
// ─── Arms cover (AnimatePresence children) ───────────────────────────────
export const ARMS_VARIANTS = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.2 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};
 
export const EYES_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};
 
// ─── Floating label (FloatingLabelInput) ─────────────────────────────────
export const LABEL_LIFTED   = { top: "8px",  fontSize: "10px" };
export const LABEL_RESTING  = { top: "16px", fontSize: "14px" };
export const LABEL_SPRING   = { type: "spring", stiffness: 400, damping: 28 };
 
// ─── Field error message ─────────────────────────────────────────────────
export const FIELD_ERROR_VARIANTS = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y:  0 },
  exit:    { opacity: 0, y: -4 },
};
 
// ─── Toast notification (custom toast component) ─────────────────────────
export const TOAST_VARIANTS = {
  initial: { opacity: 0, y: -16, scale: 0.96 },
  animate: { opacity: 1, y:   0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 28 } },
  exit:    { opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.18 } },
};
 
