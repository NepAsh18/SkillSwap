/**
 * components/characters/OrangeBlob.jsx
 *
 * The cheerful orange semi‑circle mascot – now with more personality.
 *
 * Reactions:
 *   isEmailFocused → subtle rightward lean (rotate‑y tilt)
 *   isSuccess      → squash‑and‑stretch bounce + a little star appears
 *   isError        → horizontal shake + a tiny tear drop
 *
 * Idle: perpetual gentle float (phase‑randomised per instance, so every
 *       blob sways in its own rhythm, like dandelions in a field).
 *
 * Mouse‑aware: the blob tilts slightly towards the cursor and a blush
 *              intensifies the closer you hover – it’s shy but playful!
 */

import { useEffect, useState, useRef } from "react";
import { motion, useAnimationControls, AnimatePresence } from "framer-motion";
import { CHAR_IDLE, CHAR_BOUNCE, CHAR_SHAKE } from "../../animation/framerMotion";

export default function OrangeBlob({ isEmailFocused, isSuccess, isError }) {
  const ctrl = useAnimationControls();
  const blobRef = useRef(null);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [blushOpacity, setBlushOpacity] = useState(0);

  // Random idle offset so different blobs don’t sway in sync
  const [idleDelay] = useState(() => Math.random() * 3);

  // ── Mouse tracking ──────────────────────────────────────────
  useEffect(() => {
    const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // ── Blush intensity based on proximity ──────────────────────
  useEffect(() => {
    const rect = blobRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const maxDistance = 150; // begins fading
    if (distance < maxDistance) {
      setBlushOpacity(1 - distance / maxDistance);
    } else {
      setBlushOpacity(0);
    }
  }, [mouse]);

  // ── Reactive animations ─────────────────────────────────────
  useEffect(() => {
    // Idle with random phase offset – every instance sways differently
    ctrl.start({
      ...CHAR_IDLE(0).animate,
      transition: {
        ...CHAR_IDLE(0).transition,
        delay: idleDelay,
      },
    });
  }, [ctrl, idleDelay]);

  useEffect(() => {
    if (isSuccess) ctrl.start(CHAR_BOUNCE);
  }, [isSuccess, ctrl]);
  useEffect(() => {
    if (isError) ctrl.start(CHAR_SHAKE);
  }, [isError, ctrl]);

  // ── Mouse‑driven tilt (horizontal) ─────────────────────────
  const rect = blobRef.current?.getBoundingClientRect();
  let tilt = 0;
  if (rect) {
    const dx = mouse.x - (rect.left + rect.width / 2);
    // Map dx to [-6, 6] degrees, clamped
    tilt = Math.max(-6, Math.min(6, dx * 0.02));
  }

  return (
    <motion.div
      ref={blobRef}
      animate={ctrl}
      style={{ originY: 1 }}
      className="relative inline-block"
    >
      {/* Tilt towards cursor (horizontal) + email‑focus tilt (rotation for email) */}
      <motion.div
        animate={{ rotate: tilt }}
        transition={{ type: "spring", stiffness: 50, damping: 15 }}
        style={{ originY: 1 }}
      >
        <div
          className={`transition-transform duration-300 ${
            isEmailFocused ? "rotate-6" : "rotate-0"
          }`}
        >
          {/* The blob itself */}
          <div
            className="relative flex flex-col items-center justify-center gap-1.5"
            style={{
              width: 88,
              height: 70,
              background: "#f5a623",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              overflow: "visible",
            }}
          >
            {/* Blush cheeks – appear when mouse is near */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 14,
                  height: 10,
                  background: "#ff8f9e",
                  left: 12,
                  top: 20,
                }}
                animate={{ opacity: blushOpacity }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 14,
                  height: 10,
                  background: "#ff8f9e",
                  right: 12,
                  top: 20,
                }}
                animate={{ opacity: blushOpacity }}
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* Happy squint eyes */}
            <div className="flex gap-2.5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 13,
                    height: 5,
                    background: "white",
                    borderRadius: 4,
                  }}
                />
              ))}
            </div>

            {/* Smile */}
            <div
              style={{
                width: 22,
                height: 10,
                border: "2.5px solid white",
                borderTop: "none",
                borderRadius: "0 0 22px 22px",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Animated extras (star / tear) ──────────────────────── */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            key="star"
            initial={{ scale: 0, rotate: 0, y: 10 }}
            animate={{ scale: 1, rotate: 20, y: -30 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-300 text-2xl"
            style={{ pointerEvents: "none" }}
          >
            ⭐
          </motion.div>
        )}
        {isError && (
          <motion.div
            key="tear"
            initial={{ scale: 0, y: 0 }}
            animate={{ scale: 1, y: 15 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute -bottom-2 left-8 text-sky-300 text-xl"
            style={{ pointerEvents: "none" }}
          >
            💧
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}