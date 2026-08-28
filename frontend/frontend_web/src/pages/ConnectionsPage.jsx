import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useConnections } from "../context/ConnectionsContext";
import { useChat } from "../context/ChatContext";
import { resolvePictureUrl } from "../api/assertUrl";
import Navbar from "../components/layout/Navbar";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');`;

export default function ConnectionsPage() {
  const {
    connections,
    incomingRequests,
    acceptIncoming,
    declineIncoming,
    loading,
  } = useConnections();

  return (
    <div style={{ background: '#FFFBF0', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>{FONT_IMPORT}</style>

      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-10">
        <div>
          <h1 style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 800,
            fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#1A1A2E',
            letterSpacing: '-0.02em', marginBottom: 6,
          }}>
            Connections
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', color: '#7A7A9A' }}>
            People you've connected with, and requests waiting for a reply.
          </p>
        </div>

        <IncomingSection
          requests={incomingRequests}
          onAccept={acceptIncoming}
          onDecline={declineIncoming}
          loading={loading}
        />
        <ConnectionsSection connections={connections} loading={loading} />
      </div>
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1A1A2E' }}>
        {title}
      </h2>

      {count > 0 && (
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600,
          color: '#D4891A', background: '#FFF3D0',
          padding: '2px 9px', borderRadius: 99,
        }}>
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
                resolvePictureUrl(req.user.picture) ||
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
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E8E4D8',
                    borderRadius: 14,
                    padding: 12,
                  }}
                  className="flex items-center gap-3"
                >
                  <img
                    src={avatarSrc}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    style={{ border: '1px solid #E8E4D8' }}
                  />

                  <div className="min-w-0 flex-1">
                    <p style={{
                      fontFamily: 'Inter, sans-serif', fontWeight: 600,
                      fontSize: '0.88rem', color: '#1A1A2E',
                    }} className="truncate">
                      {req.user.name}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.76rem', color: '#7A7A9A' }} className="truncate">
                      @{req.user.username}
                    </p>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onAccept(req.id)}
                      style={{
                        fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.78rem',
                        color: '#FFFFFF', background: '#4CAF82',
                        padding: '7px 14px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#419C6F'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#4CAF82'; }}
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => onDecline(req.id)}
                      style={{
                        fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.78rem',
                        color: '#7A7A9A', background: 'transparent',
                        padding: '7px 14px', borderRadius: 10,
                        border: '1px solid #E8E4D8', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#1A1A2E'; e.currentTarget.style.borderColor = '#C9C4B4'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#7A7A9A'; e.currentTarget.style.borderColor = '#E8E4D8'; }}
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
        <div style={{
          background: '#FFFFFF',
          border: '1.5px dashed #E8E4D8',
          borderRadius: 14,
          padding: '24px 20px',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#7A7A9A' }}>
            No connections yet — head to Discover to find people to connect with.
          </p>
        </div>
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
  const { openDirectChat } = useChat();
  const [starting, setStarting] = useState(false);

  const avatarSrc =
    resolvePictureUrl(c.user?.picture) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      c.user?.name || "?"
    )}`;

  const handleMessage = async () => {
    if (starting || !c.user?.userId) return;
    setStarting(true);
    try {
      // Go through ChatContext's openDirectChat, not the raw chat.js API call
      // directly — openDirectChat seeds the chat into ChatContext's own
      // `chats` state and opens the socket subscription before returning.
      // Calling the raw API here instead meant ChatContext had no idea this
      // chat existed yet when ChatThread mounted for it, which tripped the
      // "chat not in list yet" guards added for the delete/leave flow (and
      // could 404 CallBanner's scheduled-events fetch) — a real dead end,
      // not just a slow one.
      const chat = await openDirectChat(c.user.userId);
      navigate(`/chats/${chat.id}`);
    } catch (err) {
      console.error("Error starting chat:", err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E4D8',
      borderRadius: 14,
      padding: 12,
    }} className="flex items-center gap-3">
      <img
        src={avatarSrc}
        alt=""
        className="w-10 h-10 rounded-full object-cover"
        style={{ border: '1px solid #E8E4D8' }}
      />

      <div className="min-w-0 flex-1">
        <p style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 600,
          fontSize: '0.88rem', color: '#1A1A2E',
        }} className="truncate">
          {c.user.name}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.76rem', color: '#7A7A9A' }} className="truncate">
          @{c.user.username}
        </p>
      </div>

      <button
        onClick={handleMessage}
        disabled={starting}
        style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.78rem',
          color: '#FFFFFF', background: starting ? '#7A7A9A' : '#1A1A2E',
          padding: '7px 14px', borderRadius: 10, border: 'none',
          cursor: starting ? 'default' : 'pointer',
          opacity: starting ? 0.7 : 1,
          transition: 'background 0.15s',
        }}
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
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E4D8',
            borderRadius: 14,
            height: 64,
            animation: 'connections-pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes connections-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}