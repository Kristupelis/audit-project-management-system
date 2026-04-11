"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toUserFriendlyError } from "@/lib/error-message";
import { useLanguage } from "@/providers/language-provider";
import { useT } from "@/i18n/use-t";

export default function DeleteRoleButton({
  projectId,
  roleId,
}: {
  projectId: string;
  roleId: string;
}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = useT();

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/roles/${roleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          toUserFriendlyError(
            text || t.rolesManagement.deleteFailed,
            locale,
          ),
        );
      }

      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      setShowConfirm(false);
      setError(
        err instanceof Error ? err.message : t.rolesManagement.deleteFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="border rounded-md px-3 py-1 text-sm text-red-600"
      >
        {t.common.delete}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {t.rolesManagement.confirmDeleteTitle}
                </h3>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.rolesManagement.confirmDeleteMessage}
                </p>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.rolesManagement.confirmDeleteWarning}
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