export default function UploadProgress({ progress, phase }) {
  const isProcessing = phase === "processing";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isProcessing ? "w-full animate-pulse bg-amber-500" : "bg-stone-900"
          }`}
          style={!isProcessing ? { width: `${progress}%` } : undefined}
        />
      </div>
      <p className="text-xs text-stone-500">
        {isProcessing
          ? "Processing video into streaming formats — this can take a few minutes for longer files."
          : `Uploading… ${progress}%`}
      </p>
    </div>
  );
}