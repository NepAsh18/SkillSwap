import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHAR_BLACK_SHY, CHAR_IDLE } from "../../animation/framerMotion";

/**
 * Enhanced character that:
 * - Shyly covers eyes when password is focused
 * - Peek with one eye when "Show Password" is active
 * - Eyes follow mouse with spring physics
 * - Look left/right depending on which input is focused
 * - Idle blinking every 4–6 seconds
 * - Head tilt based on horizontal mouse position
 * - Bounce on password focus
 */
export default function BlackRect({
  isPasswordFocused,
  showPassword = false,
  isEmailFocused = false,
}) {
  const faceRef = useRef(null);
  const blinkTimeout = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [bounce, setBounce] = useState(false);

  // --- Mouse tracking ---
  useEffect(() => {
    const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // --- Idle blinking (random 4-6 seconds) ---
  useEffect(() => {
    const scheduleBlink = () => {
      const next = Math.random() * 2000 + 4000; // 4-6s
      blinkTimeout.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 80);
        scheduleBlink();
      }, next);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimeout.current);
  }, []);

  // --- Bounce on password focus ---
  useEffect(() => {
    if (isPasswordFocused) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isPasswordFocused]);

  // --- Calculate pupil position based on mouse or active input ---
  const faceRect = faceRef.current?.getBoundingClientRect();
  let pupilX = 0;
  let pupilY = 0;

  if (isEmailFocused) {
    // look left
    pupilX = -2;
    pupilY = 0;
  } else if (isPasswordFocused) {
    // look right
    pupilX = 2;
    pupilY = 0;
  } else if (faceRect) {
    const dx = mouse.x - (faceRect.left + faceRect.width / 2);
    const dy = mouse.y - (faceRect.top + faceRect.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const max = 2.5;
    pupilX = distance ? (dx / distance) * Math.min(max, distance / 15) : 0;
    pupilY = distance ? (dy / distance) * Math.min(max, distance / 15) : 0;
  }

  // --- Head tilt (clamped ±5°) ---
  const tilt = Math.max(-5, Math.min(5, pupilX * 2));

  // --- Eye rendering helper ---
  const Eye = ({ isLeft = false }) => {
    // For left eye: closed when password focused (unless showing password)
    // For right eye: always open, arms cover it when focused
    const eyeHeight =
      isLeft && isPasswordFocused && !showPassword ? 0 : 10;

    return (
      <motion.div
        className="relative overflow-hidden rounded-full bg-white"
        style={{
          width: 10,
          height: 10, // base, overridden by animate
          transformOrigin: "top",
        }}
        animate={{
          height: eyeHeight,
          scaleY: isBlinking ? 0.1 : 1,
        }}
        transition={{
          height: { duration: 0.5, ease: "easeInOut" },
          scaleY: { duration: 0.08 },
        }}
      >
        <motion.div
          className="absolute rounded-full bg-gray-900"
          style={{
            width: 5,
            height: 5,
            top: "50%",
            left: "50%",
            x: "-50%",
            y: "-50%",
          }}
          animate={{ x: pupilX, y: pupilY }}
          transition={{ type: "spring", stiffness: 180, damping: 15 }}
        />
      </motion.div>
    );
  };

  return (
    <motion.div
      animate={CHAR_BLACK_SHY(isPasswordFocused)}
      style={{ originY: 1 }}
    >
      {/* Head tilt */}
      <motion.div
        animate={{ rotate: tilt }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        style={{ originY: 1 }}
      >
        {/* Bounce on focus */}
        <motion.div
          animate={{ scale: bounce ? [1, 1.08, 1] : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        >
          <div
            ref={faceRef}
            className="relative flex flex-col items-center justify-center gap-2"
            style={{
              width: 62,
              height: 106,
              background: "#1a1a1a",
              borderRadius: "8px 8px 28px 28px",
            }}
          >
            {/* Eyes container (always visible, arms overlay on top when needed) */}
            <div className="relative flex gap-2 items-center" style={{ height: 30 }}>
              {/* Left eye */}
              <Eye isLeft />
              {/* Right eye */}
              <Eye />

              {/* Arms overlay – only when password is focused */}
              {isPasswordFocused && (
                <motion.div
                  className="absolute inset-0 flex gap-1 items-end"
                  style={{ height: 30 }}
                >
                  {[
                    { rotate: "-20deg" }, // left arm
                    { rotate: "20deg" },  // right arm
                  ].map((arm, i) => (
                    <motion.div
                      key={i}
                      style={{
                        width: 10,
                        height: 28,
                        background: "#2c2c2c",
                        borderRadius: 6,
                        transformOrigin: "bottom center",
                      }}
                      animate={{
                        rotate: arm.rotate,
                        // left arm moves down to reveal eye when showPassword is true
                        y: i === 0 && showPassword ? 15 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Mouth – shrinks and fades when shy */}
            <motion.div
              animate={{
                width: isPasswordFocused ? 12 : 18,
                opacity: isPasswordFocused ? 0.35 : 0.7,
              }}
              transition={{ duration: 0.3 }}
              style={{ height: 3, background: "white", borderRadius: 3 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}