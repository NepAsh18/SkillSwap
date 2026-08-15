/**
 * pages/AuthLayout.jsx
 *
 * Two-panel shell:
 *   Left  → character stage (CharacterScene, always visible)
 *   Right → AnimatePresence slide zone (Outlet renders LoginPage / SignupPage)
 *
 * Owns:
 *   - useAuthForm() — shared animation state
 *   - Page slide direction tracking via useRef
 *   - Outlet context passed to child pages
 *   - AppToaster mounted once here
 */

import { useRef }                              from "react";
import { Outlet, useLocation, useNavigate }    from "react-router-dom";
import { AnimatePresence, motion }             from "framer-motion";

import { PAGE_VARIANTS }                       from "../animation/framerMotion";
import { useAuthForm }                         from "../hooks/useAuthForm";
import CharacterScene                          from "../components/characters/CharacterScene";
import AppToaster                              from "../components/toast/Toaster";

export default function AuthLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dirRef = useRef(1);

  const { activeField, submitState, fieldProps, triggerSubmit } = useAuthForm();

  const isLogin = location.pathname === "/login";

  function handleSwitch() {
    dirRef.current = isLogin ? 1 : -1;
    navigate(isLogin ? "/signup" : "/login");
  }

  return (
    <>
      <AppToaster />

      <div className="min-h-dvh overflow-y-auto bg-surface">
        <div className="flex justify-center px-4 py-8">
          <div
            className="
              w-full
              max-w-6xl
              flex
              flex-col
              lg:flex-row
              rounded-2xl
              bg-white
              overflow-hidden
              shadow-[0_16px_64px_rgba(0,0,0,0.09)]
            "
          >
            {/* ── Left panel: character ───────────────────────── */}
            <div
              className="
                w-full
                lg:w-[520px]
                flex-shrink-0
                bg-surface
                flex
                items-end
                justify-center
                pt-8
              "
            >
              <CharacterScene
                activeField={activeField}
                submitState={submitState}
              />
            </div>

            {/* ── Right panel: animated form ─────────────────── */}
            <div className="flex-1 min-w-0 relative overflow-hidden min-h-[560px] flex items-center justify-center">
              <AnimatePresence mode="wait" custom={dirRef.current}>
                <motion.div
                  key={location.pathname}
                  custom={dirRef.current}
                  variants={PAGE_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full max-w-sm mx-auto px-6 py-12"
                >
                  <Outlet
                    context={{
                      fieldProps,
                      triggerSubmit,
                      submitState,
                      onSwitch: handleSwitch,
                      isLogin,
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}