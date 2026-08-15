/**
 * components/characters/PurpleRect.jsx
 *
 * Tall purple rectangle — now with more personality.
 *
 * Reactions:
 *   isEmailFocused    → tilts left, pupils shift right, eyes squint (concentrating)
 *   isPasswordFocused → tilts right, pupils shift left, eyes squint
 *   Neither           → eyes fully open, pupils follow the mouse
 *
 * Idle: gentle float with a per‑instance random delay so every rectangle
 *       sways in its own rhythm (like dandelions in a field).
 *
 * Mouse‑aware: pupils track the cursor via spring physics when both inputs
 *              are blurred.
 *
 * Idle blinking: eyes blink randomly every 4–6 seconds.
 */

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  CHAR_PURPLE_LOOK,
  CHAR_PUPIL_X,
  CHAR_IDLE,
} from "../../animation/framerMotion";

export default function PurpleRect({ isEmailFocused, isPasswordFocused }) {
  const faceRef = useRef(null);
  const blinkTimeout = useRef(null);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // random idle offset to avoid all characters floating in sync
  const [idleDelay] = useState(() => Math.random() * 3);

  // ── Mouse tracking ──────────────────────────────────────────
  useEffect(() => {
    const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // ── Idle blinking (random interval 4–6 s) ───────────────────
  useEffect(() => {
    const scheduleBlink = () => {
      const next = Math.random() * 2000 + 4000; // 4000–6000 ms
      blinkTimeout.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 80);
        scheduleBlink();
      }, next);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimeout.current);
  }, []);

  // ── Pupil position ─────────────────────────────────────────
  const faceRect = faceRef.current?.getBoundingClientRect();
  let pupilX = 0;
  let pupilY = 0;

  if (isEmailFocused) {
    // Look right (pupils go to the right of the eye)
    pupilX = 3;
    pupilY = 0;
  } else if (isPasswordFocused) {
    // Look left
    pupilX = -3;
    pupilY = 0;
  } else if (faceRect) {
    const dx = mouse.x - (faceRect.left + faceRect.width / 2);
    const dy = mouse.y - (faceRect.top + faceRect.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const max = 2.5;
    pupilX = distance ? (dx / distance) * Math.min(max, distance / 15) : 0;
    pupilY = distance ? (dy / distance) * Math.min(max, distance / 15) : 0;
  }

  // ── Eye squint when focused ─────────────────────────────────
  const isFocused = isEmailFocused || isPasswordFocused;
  const eyeHeight = isFocused ? 5 : 11; // half‑closed vs wide open

  // ── Tilt (from existing animation constants) ────────────────
  const tiltAnimation = CHAR_PURPLE_LOOK(isEmailFocused, isPasswordFocused);

  // ── Eye component ───────────────────────────────────────────
  const Eye = () => (
    <motion.div
      className="relative overflow-hidden rounded-full bg-white"
      style={{ width: 11, height: 11, transformOrigin: "top" }}
      animate={{
        height: eyeHeight,
        scaleY: isBlinking ? 0.1 : 1,
      }}
      transition={{
        height: { duration: 0.35, ease: "easeInOut" },
        scaleY: { duration: 0.08 },
      }}
    >
      <motion.div
        className="absolute rounded-full bg-gray-900"
        style={{
          width: 6,
          height: 6,
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
        }}
        animate={{ x: pupilX, y: pupilY }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />
    </motion.div>
  );

  return (
    <motion.div
      ref={faceRef}
      animate={{
        ...tiltAnimation,
        ...CHAR_IDLE(idleDelay).animate,
      }}
      style={{ originY: 1 }}
    >
      <div
        className="relative flex flex-col items-center justify-center gap-2"
        style={{
          width: 70,
          height: 118,
          background: "#7c5cbf",
          borderRadius: "14px 14px 6px 6px",
        }}
      >
        {/* Eyes */}
        <div className="flex gap-2.5">
          <Eye />
          <Eye />
        </div>
      </div>
    </motion.div>
  );
}