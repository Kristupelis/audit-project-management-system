"use client";

import { useState } from "react";

type Props = {
  projectId: string;
  label: string;
  errorTitle: string;
  closeLabel: string;
  loadingLabel: string;
};

export default function GenerateReportButton({
  projectId,
  label,
  errorTitle,
  closeLabel,
  loadingLabel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/report`, {
        method: "GET",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to generate report.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `project-report-${projectId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="border px-3 py-1 rounded"
        onClick={() => void handleGenerate()}
        disabled={loading}
        type="button"
      >
        {loading ? loadingLabel : label}
      </button>

      {error && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {errorTitle}
                </h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {error}
                </p>
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