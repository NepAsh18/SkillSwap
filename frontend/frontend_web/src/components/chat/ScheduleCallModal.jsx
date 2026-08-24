import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scheduleCall } from "../../api/chat";

export default function ScheduleCallModal({ chatId, onClose, onScheduled }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().slice(0, 10);
  const minDateStr = new Date().toISOString().slice(0, 10);

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim() || !date || !time) {
      setError("Fill in a title, date, and time.");
      return;
    }
    const scheduledAt = new Date(`${date}T${time}`);
    if (scheduledAt <= new Date()) {
      setError("Pick a time in the future.");
      return;
    }
    if (scheduledAt > maxDate) {
      setError("Can't schedule more than 3 months ahead.");
      return;
    }

    setSubmitting(true);
    try {
      const event = await scheduleCall(chatId, {
        title: title.trim(),
        scheduledAt: scheduledAt.toISOString(),
      });
      onScheduled?.(event);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't schedule the call — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl"
        >
          <p className="text-sm font-bold text-slate-800">Schedule a call</p>
          <p className="text-xs text-slate-400 mt-1">Up to 3 months in advance.</p>

          <div className="flex flex-col gap-3 mt-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Call title"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                min={minDateStr}
                max={maxDateStr}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="text-sm font-medium text-slate-500 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-sm font-semibold text-white bg-teal-500 px-3.5 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Scheduling…" : "Schedule"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}