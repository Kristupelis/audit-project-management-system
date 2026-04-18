"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  projectId: string;
  isLocked: boolean;
  lockLabel: string;
  unlockLabel: string;
  loadingLabel: string;
  errorTitle: string;
  closeLabel: string;
};

export default function LockProjectButton({
  projectId,
  isLocked,
  lockLabel,
  unlockLabel,
  loadingLabel,
  errorTitle,
  closeLabel,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleLock() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/${isLocked ? "unlock" : "lock"}`, {
        method: "PATCH",
      });

      const text = await res.text().catch(() => "");

      if (!res.ok) {
        throw new Error(text || "Failed to change project lock state.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change project lock state.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="border px-3 py-1 rounded"
        onClick={() => void toggleLock()}
        disabled={loading}
        type="button"
      >
        {loading ? loadingLabel : isLocked ? unlockLabel : lockLabel}
      </button>

      {error && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {errorTitle}
                </h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
              </div>

              <button
                className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                onClick={() => setError(null)}
                type="button"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}