

import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import OrangeBlob from "./OrangeBlob";
import PurpleRect from "./PurpleRect";
import BlackRect from "./BlackRect";
import YellowBlob from "./YellowBlob";

export default function CharacterScene({ activeField, submitState }) {
  const isEmailFocused = activeField === "email" || activeField === "name";
  const isPasswordFocused = activeField === "password";
  const isAnyFocused = activeField !== null;
  const isSuccess = submitState === "success";
  const isError = submitState === "error";

  const sceneCtrl = useAnimationControls();

  // ── Scene‑level animations ──────────────────────────────────
  useEffect(() => {
    // perpetual idle sway – each instance can have a random delay
    sceneCtrl.start({
      y: [0, -4, 0],
      rotate: [0, 0.5, -0.5, 0],
      transition: {
        y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
        rotate: { repeat: Infinity, duration: 5, ease: "easeInOut" },
      },
    });
  }, [sceneCtrl]);

  // Focus tilt – group leans toward the focused input
  useEffect(() => {
    let tilt = 0;
    if (isEmailFocused) tilt = -2;
    else if (isPasswordFocused) tilt = 2;

    sceneCtrl.start({
      rotate: tilt,
      y: -2, // slight lift when focused
      transition: { type: "spring", stiffness: 120, damping: 12 },
    });
  }, [isEmailFocused, isPasswordFocused, sceneCtrl]);

  // Submit feedback – jump or shake
  useEffect(() => {
    if (isSuccess) {
      sceneCtrl.start({
        scale: [1, 1.04, 1],
        transition: { duration: 0.4 },
      });
    }
    if (isError) {
      sceneCtrl.start({
        x: [0, -3, 3, -3, 3, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [isSuccess, isError, sceneCtrl]);

  return (
    <motion.div
      className="relative"
      animate={sceneCtrl}
      style={{ originY: 1 }} // pivot at bottom so they feel grounded
    >
      {/* Background glow overlay – green/red based on state */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          backgroundColor:
            submitState === "success"
              ? "rgba(34, 197, 94, 0.08)"
              : submitState === "error"
              ? "rgba(239, 68, 68, 0.08)"
              : "rgba(255,255,255,0)",
          scale: submitState === "success" ? 1.15 : 1,
          transition: { duration: 0.5 },
        }}
      />

      {/* Character row */}
      <div className="flex items-end justify-center gap-2 h-52 select-none pb-0 relative z-10">
        <OrangeBlob
          isEmailFocused={isEmailFocused}
          isSuccess={isSuccess}
          isError={isError}
        />
        <PurpleRect
          isEmailFocused={isEmailFocused}
          isPasswordFocused={isPasswordFocused}
        />
        <BlackRect
          isPasswordFocused={isPasswordFocused}
        />
        <YellowBlob
          isAnyFocused={isAnyFocused}
          isSuccess={isSuccess}
        />
      </div>
    </motion.div>
  );
}