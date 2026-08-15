import { useState } from "react";

export default function AgeVerificationLookup({ status, isLoading, isRevoking, onLookup, onRevoke }) {
  const [userId, setUserId] = useState("");

  return (
    <div className="rounded-lg border border-stone-200 p-5">
      <h3 className="text-sm font-medium text-stone-900">Look up a user's verification status</h3>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User UUID"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <button
          type="button"
          disabled={!userId.trim() || isLoading}
          onClick={() => onLookup(userId.trim())}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {isLoading ? "Looking up…" : "Look up"}
        </button>
      </div>

      {status && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-stone-50 px-4 py-3">
          <div>
            <p className="text-sm text-stone-700">
              Status:{" "}
              <span className={status.isVerified ? "font-semibold text-emerald-700" : "font-semibold text-stone-500"}>
                {status.isVerified ? "Verified" : "Not verified"}
              </span>
            </p>
          </div>
          {status.isVerified && (
            <button
              type="button"
              disabled={isRevoking}
              onClick={() => onRevoke(status.userId)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {isRevoking ? "Revoking…" : "Revoke"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}