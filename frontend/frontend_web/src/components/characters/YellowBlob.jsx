

import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { CHAR_IDLE, CHAR_YELLOW_LEAN } from "../../animation/framerMotion";

export default function YellowBlob({ isAnyFocused, isSuccess }) {
  const ctrl = useAnimationControls();

  useEffect(() => { ctrl.start(CHAR_IDLE(1.2).animate); }, [ctrl]);

  useEffect(() => {
    if (isSuccess) {
      ctrl.start({
        rotate: [0, -8, 8, -5, 5, 0],
        transition: { duration: 0.55 },
      });
    }
  }, [isSuccess, ctrl]);

  return (
    <motion.div
      animate={{ ...CHAR_YELLOW_LEAN(isAnyFocused), ...ctrl }}
      style={{ originY: 1 }}
    >
      <motion.div animate={ctrl}>
        {/* Body — rounded arch shape */}
        <div
          className="relative flex flex-col items-center justify-center gap-1"
          style={{
            width:        52,
            height:       62,
            background:   "#f9d423",
            borderRadius: "50% 50% 38% 38% / 55% 55% 45% 45%",
          }}
        >
          {/* Single curious eye */}
          <div className="flex gap-1.5">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-full bg-white"
                style={{ width: 9, height: 9 }}
              >
                <div
                  className="absolute rounded-full bg-gray-900"
                  style={{
                    width:     5,
                    height:    5,
                    top:       "50%",
                    left:      isAnyFocused ? "60%" : "50%",
                    transform: "translate(-50%, -50%)",
                    transition: "left 0.25s ease",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Beak / neutral line mouth */}
          <div
            style={{
              width:        10,
              height:       5,
              border:       "2px solid #c8a800",
              borderTop:    "none",
              borderRadius: "0 0 8px 8px",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}