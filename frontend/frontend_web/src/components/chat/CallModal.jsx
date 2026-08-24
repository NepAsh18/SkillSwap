import { useState, useCallback } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { joinScheduledEvent, markEventEnded } from "../../api/chat";

export default function CallModal({ chatId, event, currentUserName, onClose, onCallEnded }) {
  const [joined, setJoined] = useState(false);
  const [roomName, setRoomName] = useState(null);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  const isLive = event.status === "STARTED";

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      const res = await joinScheduledEvent(chatId, event.id);
      if (!res.jitsiRoomName) {
        setError("The call hasn't started yet.");
        return;
      }
      setRoomName(res.jitsiRoomName);
      setJoined(true);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't join — try again in a moment.");
    } finally {
      setJoining(false);
    }
  };

  const handleCallEnded = useCallback(() => {
    markEventEnded(chatId, event.id).catch(console.error);
    onCallEnded?.(event); // triggers the feedback flow upstream
    onClose();
  }, [chatId, event, onCallEnded, onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 flex-shrink-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{event.title}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>

        <div className="flex-1 min-h-0">
          {!joined ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
              {isLive ? (
                <>
                  <p className="text-sm text-slate-600">The call is live — ready to join?</p>
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="text-sm font-semibold text-white bg-teal-500 px-5 py-2.5 rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
                  >
                    {joining ? "Joining…" : "Join call"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  This call starts at {new Date(event.scheduledAt).toLocaleString()}. The join button unlocks once it begins.
                </p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          ) : (
            <JitsiMeeting
              domain="meet.jit.si"
              roomName={roomName}
              userInfo={{ displayName: currentUserName || "SkillSwap user" }}
              configOverwrite={{
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                disableModeratorIndicator: true,
              }}
              interfaceConfigOverwrite={{
                TOOLBAR_BUTTONS: [
                  "microphone", "camera", "hangup", "chat", "raisehand",
                  "tileview", "fullscreen", "settings",
                ],
              }}
              onReadyToClose={handleCallEnded}
              getIFrameRef={(iframeRef) => {
                iframeRef.style.height = "100%";
                iframeRef.style.width = "100%";
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}