import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // 1. Added Route and Navigate
import { AnimatePresence, motion } from "framer-motion";

import IntroSequence from "./components/IntroSequence";
import { BadgeProvider } from "./context/BadgeContext";
import DynamicPage from "./pages/DynamicPage"; // 2. Import your DynamicPage component

import { AdminRouter } from "./router/admin/AdminRouter";
import { CommitteeRouter } from "./router/committee/CommitteeRouter";
import { UserRouter } from "./router/user/UserRouter";
import { ConnectionsProvider } from './context/ConnectionsContext';

export default function App() {
    const [showIntro, setShowIntro] = useState(true);

    return (
        <BrowserRouter>
        <ConnectionsProvider>
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
                            {/* 3. Handle the root path redirect and map the /dynamic route */}
                            <Route path="/" element={<Navigate to="/dynamicpage" replace />} />
                            <Route path="/dynamicpage" element={<DynamicPage />} />

                            {/* Your existing sub-routers */}
                            {AdminRouter}
                            {CommitteeRouter}
                            {UserRouter}
                        </Routes>
                    </motion.div>
                )}
            </AnimatePresence>
            </BadgeProvider>
            </ConnectionsProvider>
        </BrowserRouter>
    );
}