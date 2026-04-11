"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toUserFriendlyError } from "@/lib/error-message";
import { useT } from "@/i18n/use-t";

export default function DeleteProjectButton({
  projectId,
  variant = "detail",
}: {
  projectId: string;
  variant?: "detail" | "list";
}) {
  const router = useRouter();
  const t = useT();

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(toUserFriendlyError(text));
      }

      setShowConfirm(false);

      if (variant === "detail") {
        router.push("/projects");
      } else {
        router.refresh();
      }

      router.refresh();
    } catch (error) {
      setShowConfirm(false);
      setError(
        error instanceof Error ? error.message : t.projects.deleteFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className={
          variant === "detail"
            ? "border px-3 py-1 rounded text-red-600"
            : "border rounded-md px-3 py-1 text-sm text-red-600"
        }
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        type="button"
      >
        {loading
          ? t.projects.deleting
          : variant === "detail"
            ? t.projects.deleteProject
            : t.common.delete}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {t.projects.confirmDeleteTitle}
                </h3>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.projects.confirmDeleteMessage}
                </p>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.projects.confirmDeleteWarning}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  type="button"
                >
                  {t.common.cancel}
                </button>

                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={() => void onDelete()}
                  disabled={loading}
                  type="button"
                >
                  {loading ? t.projects.deleting : t.common.delete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {t.common.error}
                </h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
              </div>

              <button
                className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                onClick={() => setError(null)}
                type="button"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}