import { useState } from "react";
import { useUpload } from "../../hooks/useUpload";
import UploadProgress from "./UploadProgress";
import ErrorBanner from "../common/ErrorBanner";

export default function UploadForm({ onUploaded }) {
  const { upload, progress, phase, error, result, reset } = useUpload();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [is18Plus, setIs18Plus] = useState(false);

  const isBusy = phase === "uploading" || phase === "processing";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    const data = await upload({ file, title, description, is18Plus });
    if (data) {
      onUploaded?.(data);
      setFile(null);
      setTitle("");
      setDescription("");
      setIs18Plus(false);
      reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="video-file">
          Video file
        </label>
        <input
          id="video-file"
          type="file"
          accept="video/*"
          disabled={isBusy}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-stone-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="video-title">
          Title
        </label>
        <input
          id="video-title"
          type="text"
          value={title}
          disabled={isBusy}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="video-description">
          Description
        </label>
        <textarea
          id="video-description"
          value={description}
          disabled={isBusy}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full resize-none rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={is18Plus}
          disabled={isBusy}
          onChange={(e) => setIs18Plus(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300"
        />
        Mark as 18+ content
      </label>

      {error && <ErrorBanner error={error} />}
      {result && phase === "done" && (
        <p className="text-sm font-medium text-emerald-700">
          Upload complete — “{result.title}” is ready to stream.
        </p>
      )}

      {isBusy && <UploadProgress progress={progress} phase={phase} />}

      <button
        type="submit"
        disabled={isBusy || !file || !title.trim()}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {isBusy ? "Uploading…" : "Upload video"}
      </button>
    </form>
  );
}