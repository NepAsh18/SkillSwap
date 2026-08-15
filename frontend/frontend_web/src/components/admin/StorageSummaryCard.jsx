export default function StorageSummaryCard({ storage }) {
  if (!storage) return null;

  return (
    <div className="rounded-lg border border-stone-200 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        Total raw storage used
      </p>
      <p className="mt-1 text-2xl font-semibold text-stone-900">
        {storage.totalFormatted}
      </p>
    </div>
  );
}