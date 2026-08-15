export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 px-6 py-16 text-center">
      <p className="text-base font-medium text-stone-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}