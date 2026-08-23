import { useConnections } from "../../context/ConnectionsContext";
import { resolvePictureUrl } from "../../api/assertUrl";
export default function ConnectionsList() {
  const { connections } = useConnections();

  if (connections.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-semibold text-surface mb-3">
        Your connections
      </h2>
      <div className="flex flex-col gap-2">
        {connections.map((c) => (
          <div
            key={c.id}
            className="bg-surface rounded-xl p-3 flex items-center gap-3"
          >
            <img
              src={resolvePictureUrl(c.user.picture) || `https://api.dicebear.com/7.x/initials/svg?seed=${c.user.name}`}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">{c.user.name}</p>
              <p className="text-xs text-muted truncate">@{c.user.username}</p>
            </div>
            <button
              className="text-xs font-semibold text-surface bg-ink px-3 py-1.5 rounded-lg hover:bg-ink/90 transition-colors"
              // No handler yet — message functionality comes later.
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
