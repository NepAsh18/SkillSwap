import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchChatMedia, downloadChatMedia, resolveMediaUrl } from "../../api/chat";

const TABS = [
  { type: "IMAGE", label: "Images" },
  { type: "DOC", label: "Docs" },
  { type: "VIDEO", label: "Videos" },
];

export default function FilesPanel({ chatId, onClose }) {
  const [activeType, setActiveType] = useState("IMAGE");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (item) => {
    setDownloadingId(item.id);
    try {
      await downloadChatMedia(item.mediaUrl, item.mediaFileName);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    fetchChatMedia(chatId, activeType, query)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [chatId, activeType, query]);

  useEffect(() => {
    const debounce = setTimeout(load, 250); // avoid a request per keystroke
    return () => clearTimeout(debounce);
  }, [load]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-xl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <p className="text-sm font-bold text-slate-700">Shared files</p>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
              ✕
            </button>
          </div>

          <div className="flex gap-1 px-4 pt-3 border-b border-slate-50 pb-3">
            {TABS.map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveType(tab.type)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  activeType === tab.type ? "bg-teal-500 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-4 pt-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by file name…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <SkeletonGrid type={activeType} />
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">
                No {activeType.toLowerCase()}s found{query ? ` for "${query}"` : ""}.
              </p>
            ) : activeType === "IMAGE" ? (
              <div className="grid grid-cols-3 gap-2">
                {items.map((item) => (
                  <div key={item.id} className="relative group">
                    <img
                      src={resolveMediaUrl(item.mediaUrl)}
                      alt={item.mediaFileName || ""}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === item.id}
                      title="Download"
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                    >
                      {downloadingId === item.id ? <SpinnerIcon /> : <DownloadIcon />}
                    </button>
                  </div>
                ))}
              </div>
            ) : activeType === "VIDEO" ? (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.id} className="relative">
                    <video src={resolveMediaUrl(item.mediaUrl)} controls className="w-full rounded-lg max-h-48" />
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === item.id}
                      className="mt-1 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 disabled:opacity-60"
                    >
                      {downloadingId === item.id ? <SpinnerIcon /> : <DownloadIcon />}
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <DocIcon />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 truncate">{item.mediaFileName || "Document"}</p>
                        <p className="text-xs text-slate-400">{formatSize(item.mediaSizeBytes)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === item.id}
                      title="Download"
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-60"
                    >
                      {downloadingId === item.id ? <SpinnerIcon /> : <DownloadIcon />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function SkeletonGrid({ type }) {
  const count = type === "IMAGE" ? 9 : 4;
  return (
    <div className={type === "IMAGE" ? "grid grid-cols-3 gap-2" : "flex flex-col gap-2"}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-slate-50 animate-pulse rounded-lg ${type === "IMAGE" ? "h-24" : "h-14"}`} />
      ))}
    </div>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 flex-shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" strokeLinecap="round" />
    </svg>
  );
}