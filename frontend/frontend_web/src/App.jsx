import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

import IntroSequence from "./components/IntroSequence";
import { BadgeProvider } from "./context/BadgeContext";
import DynamicPage from "./pages/DynamicPage";

import { AdminRouter } from "./router/admin/AdminRouter";
import { CommitteeRouter } from "./router/committee/CommitteeRouter";
import { UserRouter } from "./router/user/UserRouter";
import { ConnectionsProvider } from './context/ConnectionsContext';
import { ChatProvider } from './context/ChatContext';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <BrowserRouter>
      <ConnectionsProvider>
        <ChatProvider>
          <BadgeProvider>
            <AnimatePresence mode="wait">
              {showIntro ? (
                <motion.div
                  key="intro"
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                >
                  <IntroSequence
                    onComplete={() => setShowIntro(false)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="app"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Navigate to="/dynamicpage" replace />} />
                    <Route path="/dynamicpage" element={<DynamicPage />} />

                    {AdminRouter}
                    {CommitteeRouter}
                    {UserRouter}
                  </Routes>
                </motion.div>
              )}
            </AnimatePresence>
          </BadgeProvider>
        </ChatProvider>
      </ConnectionsProvider>
    </BrowserRouter>
  );
}