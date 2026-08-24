import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import FeedbackCard from "./FeedbackCard";

// targets: array of { userId, name, picture } — the other people from the call.
export default function PostCallFeedbackModal({ targets, chatId, scheduledEventId, onClose }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = targets[index];
  const isLast = index === targets.length - 1;

  const advance = () => {
    if (isLast) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleDone = () => {
    onClose();
    navigate("/dynamicpage");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="w-full max-w-sm"
        >
          {finished ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Thanks for the feedback!</p>
              <p className="text-xs text-slate-400 mt-1">It helps improve everyone's SkillSwap profile.</p>
              <button
                onClick={handleDone}
                className="mt-4 text-sm font-semibold text-white bg-teal-500 px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {targets.length > 1 && (
                <p className="text-xs text-slate-400 text-center mb-2">
                  {index + 1} of {targets.length}
                </p>
              )}
              <FeedbackCard
                targetUser={current}
                chatId={chatId}
                scheduledEventId={scheduledEventId}
                onDone={advance}
                onSkip={advance}
              />
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}