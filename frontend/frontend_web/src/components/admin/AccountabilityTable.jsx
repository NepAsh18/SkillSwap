import StatusBadge from "../common/StatusBadge";

export default function AccountabilityTable({ records }) {
  if (records.length === 0) {
    return <p className="py-8 text-center text-sm text-stone-500">No uploads recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Title</th>
            <th className="px-4 py-2.5 font-medium">Uploaded by</th>
            <th className="px-4 py-2.5 font-medium">Size</th>
            <th className="px-4 py-2.5 font-medium">18+</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Uploaded</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {records.map((r) => (
            <tr key={r.videoUuid}>
              <td className="px-4 py-2.5 font-medium text-stone-900">{r.title}</td>
              <td className="px-4 py-2.5 text-stone-600">
                <div>{r.uploadedByUsername}</div>
                <div className="text-xs text-stone-400">{r.uploadedByEmail}</div>
              </td>
              <td className="px-4 py-2.5 text-stone-600">{r.fileSizeFormatted}</td>
              <td className="px-4 py-2.5">
                {r.is18Plus ? (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                    18+
                  </span>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={r.processingStatus} />
              </td>
              <td className="px-4 py-2.5 text-stone-500">
                {new Date(r.uploadedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}