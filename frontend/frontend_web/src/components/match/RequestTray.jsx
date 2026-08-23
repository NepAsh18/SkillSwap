import { AnimatePresence, motion } from "framer-motion";
import { useConnections } from "../../context/ConnectionsContext";
import { resolvePictureUrl } from "../../api/assertUrl";

// Persistent tray, not a fire-and-forget toast: incoming requests sit in the
// bottom-right corner until the recipient acts (accept / decline). This
// matches the requirement that the request "stays until user accept,
// cancel, or delete."
export default function RequestTray() {
  const { incomingRequests, acceptIncoming, declineIncoming } = useConnections();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
      <AnimatePresence>
        {incomingRequests.map((req) => (
          <motion.div
            key={req.id}
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="bg-surface rounded-xl shadow-xl shadow-black/30 p-3 flex items-center gap-3"
          >
            <img
              src={resolvePictureUrl(req.user.picture) || `https://api.dicebear.com/7.x/initials/svg?seed=${req.user.name}`}
              alt=""
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">{req.user.name}</p>
              <p className="text-xs text-muted">wants to connect</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => acceptIncoming(req.id)}
                className="text-xs font-semibold text-surface bg-teach px-2.5 py-1.5 rounded-lg hover:bg-teach/90 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => declineIncoming(req.id)}
                aria-label="Delete request"
                className="text-xs text-muted hover:text-ink px-2 py-1.5 transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
