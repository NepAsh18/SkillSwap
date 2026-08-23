import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useConnections } from "../context/ConnectionsContext";
import { resolvePictureUrl } from "../api/assertUrl";
import { getOrCreateDirectChat } from "../api/chat";

export default function ConnectionsPage() {
  const {
    connections,
    incomingRequests,
    acceptIncoming,
    declineIncoming,
    loading,
  } = useConnections();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-10">
      <IncomingSection
        requests={incomingRequests}
        onAccept={acceptIncoming}
        onDecline={declineIncoming}
        loading={loading}
      />
      <ConnectionsSection connections={connections} loading={loading} />
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="font-display text-lg font-semibold text-surface">
        {title}
      </h2>

      {count > 0 && (
        <span className="text-xs font-semibold text-surface bg-surface/15 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

function IncomingSection({ requests, onAccept, onDecline, loading }) {
  if (loading) return <SkeletonBlock />;
  if (requests.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title="Requests waiting for you"
        count={requests.length}
      />

      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {requests
            .filter((req) => req?.user)
            .map((req) => {
              const avatarSrc =
                req.user.picture ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  req.user.name || "?"
                )}`;

              return (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    transition: { duration: 0.15 },
                  }}
                  transition={{ type: "spring", damping: 24, stiffness: 300 }}
                  className="bg-surface rounded-xl p-3 flex items-center gap-3"
                >
                  <img
                    src={avatarSrc}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {req.user.name}
                    </p>
                    <p className="text-xs text-muted truncate">
                      @{req.user.username}
                    </p>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onAccept(req.id)}
                      className="text-xs font-semibold text-surface bg-teach px-3 py-1.5 rounded-lg hover:bg-teach/90 transition-colors"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => onDecline(req.id)}
                      className="text-xs font-medium text-muted hover:text-ink px-3 py-1.5 rounded-lg border border-ink/10 hover:border-ink/20 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ConnectionsSection({ connections, loading }) {
  if (loading) return <SkeletonBlock />;

  return (
    <section>
      <SectionHeader title="Your connections" count={connections.length} />

      {connections.length === 0 ? (
        <p className="text-sm text-muted">
          No connections yet — head to Discover to find people to connect
          with.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {connections.map((c) => (
            <ConnectionRow key={c.id} connection={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function ConnectionRow({ connection: c }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const avatarSrc =
    c.user?.picture ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      c.user?.name || "?"
    )}`;

  const handleMessage = async () => {
    if (starting || !c.user?.userId) return;
    setStarting(true);
    try {
      const chat = await getOrCreateDirectChat(c.user.userId);
      navigate(`/chats/${chat.id}`);
    } catch (err) {
      console.error("Error starting chat:", err);
      setStarting(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl p-3 flex items-center gap-3">
      <img
        src={avatarSrc}
        alt=""
        className="w-10 h-10 rounded-full object-cover"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink truncate">
          {c.user.name}
        </p>
        <p className="text-xs text-muted truncate">@{c.user.username}</p>
      </div>

      <button
        onClick={handleMessage}
        disabled={starting}
        className="text-xs font-semibold text-surface bg-ink px-3 py-1.5 rounded-lg hover:bg-ink/90 disabled:opacity-50 transition-colors"
      >
        {starting ? "Opening…" : "Message"}
      </button>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface/50 rounded-xl p-3 h-16 animate-pulse"
        />
      ))}
    </div>
  );
}