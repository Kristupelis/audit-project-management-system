"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useT } from "@/i18n/use-t";

const WARNING_MS = 5 * 60 * 1000;

export default function SessionExpiryManager() {
  const { data: session, status } = useSession();
  const accessExpiresAt = session?.apiAccessExpiresAt ?? null;

  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const t = useT();

  useEffect(() => {
    if (status !== "authenticated" || accessExpiresAt === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowWarning(false);
      setShowExpired(false);
      return;
    }

    const expiresAt = accessExpiresAt;

    function evaluateExpiry() {
      const remaining = expiresAt - Date.now();

      if (remaining <= 0) {
        setShowWarning(false);
        setShowExpired(true);
        return;
      }

      if (remaining <= WARNING_MS) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }

      setShowExpired(false);
    }

    evaluateExpiry();

    const interval = window.setInterval(evaluateExpiry, 15000);
    const timeoutToWarning = window.setTimeout(
      evaluateExpiry,
      Math.max(expiresAt - WARNING_MS - Date.now(), 0),
    );

    const handleVisibility = () => evaluateExpiry();
    const handleFocus = () => evaluateExpiry();
    const handlePageShow = () => evaluateExpiry();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeoutToWarning);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [accessExpiresAt, status]);

  if (status !== "authenticated" || accessExpiresAt === null) {
    return null;
  }

    return (
    <>
      {showWarning && !showExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-red-700">
                  {t.sessionExpiry.soon}
                </h2>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.sessionExpiry.soon2}
                </p>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.sessionExpiry.soon3}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={() => setShowWarning(false)}
                >
                  {t.sessionExpiry.continue}
                </button>

                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  { t.sessionExpiry.logOut}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-red-700">
                  {t.sessionExpiry.expired}
                </h2>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.sessionExpiry.expired2}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  {t.sessionExpiry.signIn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}