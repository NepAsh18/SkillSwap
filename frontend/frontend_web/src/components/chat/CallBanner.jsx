import { useEffect, useState, useCallback } from "react";
import { fetchScheduledEvents, cancelScheduledEvent } from "../../api/chat";

function formatWhen(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const datePart = sameDay
    ? "Today"
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

export default function CallBanner({ chatId, currentUserId, isLeader, isGroup, onOpenCall, refreshKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetchScheduledEvents(chatId)
      .then((data) => setEvents(data.filter((e) => e.status === "SCHEDULED" || e.status === "STARTED")))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [chatId]);

  useEffect(() => {
    load();
    // Light polling so STARTED transitions (fired server-side by the poller)
    // show up without the user refreshing. 20s is a reasonable balance.
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load, refreshKey]);

  if (loading || events.length === 0) return null;

  // Soonest event first — STARTED ones sort earlier naturally since scheduledAt is in the past for them.
  const next = [...events].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];
  const isLive = next.status === "STARTED";
  const canCancel = next.createdBy === currentUserId || (isGroup && isLeader);

  const handleCancel = async (e) => {
    e.stopPropagation();
    try {
      await cancelScheduledEvent(chatId, next.id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={() => onOpenCall(next)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 border-b transition-colors text-left ${
        isLive ? "bg-teal-500 border-teal-600 text-white hover:bg-teal-600" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isLive ? "bg-white animate-pulse" : "bg-teal-500"}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold truncate ${isLive ? "text-white" : "text-slate-800"}`}>
          {isLive ? "Call is live now" : next.title}
        </p>
        {!isLive && (
          <p className="text-xs text-slate-400">{formatWhen(next.scheduledAt)}</p>
        )}
      </div>
      {isLive ? (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 flex-shrink-0">Join</span>
      ) : (
        canCancel && (
          <span
            onClick={handleCancel}
            className="text-xs font-medium text-slate-400 hover:text-red-500 px-2 py-1 flex-shrink-0"
          >
            Cancel
          </span>
        )
      )}
    </button>
  );
}