export default function ErrorBanner({ error, onRetry }) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-medium underline underline-offset-2 hover:text-red-900"
        >
          Try again
        </button>
      )}
    </div>
  );
}