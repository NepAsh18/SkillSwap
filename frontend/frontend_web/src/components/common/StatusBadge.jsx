const STYLES = {
  PENDING: "bg-stone-100 text-stone-600",
  PROCESSING: "bg-amber-100 text-amber-800",
  READY: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}