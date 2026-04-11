"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import Language from "@/components/language-switcher";
import { useT } from "@/i18n/use-t";

export default function ProjectsHeader({
  name,
  systemRole,
}: {
  name: string | null | undefined;
  systemRole?: string | null;
}) {
  const t = useT();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{t.main.projects}</h1>
          <p className="text-sm opacity-80">
            {t.main.loggedIn} <span className="font-medium">{name ?? "User"}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Language />

          <Link
            href="/account"
            className="border rounded-md px-3 py-2 hover:bg-gray-800"
          >
            {t.main.account}
          </Link>

          {systemRole === "SUPER_ADMIN" && (
            <Link
              href="/admin"
              className="border rounded-md px-3 py-2 hover:bg-gray-800"
            >
              Admin
            </Link>
          )}

          <button
            onClick={() => setShowConfirm(true)}
            className="border rounded-md px-3 py-2 hover:bg-gray-800"
            type="button"
          >
            {t.main.signOut}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {t.confirmations.signOutTitle}
                </h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.confirmations.signOutMessage}
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
                  onClick={() => void handleSignOut()}
                  disabled={loading}
                  type="button"
                >
                  {loading ? t.common.loading : t.main.signOut}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}