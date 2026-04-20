/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/use-t";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [showSessionEnded, setShowSessionEnded] = useState(false);

  useEffect(() => {
    const blocked = searchParams.get("blocked");
    const sessionEnded = searchParams.get("sessionEnded");
    const reason = searchParams.get("reason");

    if (blocked === "1") {
      setBlockedReason(reason ? decodeURIComponent(reason) : null);
      return;
    }

    if (sessionEnded === "1") {
      setShowSessionEnded(true);
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBlockedReason(null);
    setShowSessionEnded(false);
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res) {
      setError(t.authPages.loginFailed);
      return;
    }

    if (res.error?.startsWith("2FA_SETUP_REQUIRED:")) {
      const [, userId, returnedEmail] = res.error.split(":");
      router.push(
        `/login/2fa?mode=setup&userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(returnedEmail ?? email)}`,
      );
      return;
    }

    if (res.error?.startsWith("2FA_REQUIRED:")) {
      const [, userId, returnedEmail] = res.error.split(":");
      router.push(
        `/login/2fa?mode=verify&userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(returnedEmail ?? email)}`,
      );
      return;
    }

    if (res.error) {
      try {
        const parsed = JSON.parse(res.error) as {
          code?: string;
          reason?: string | null;
          message?: string;
        };

        if (parsed.code === "ACCOUNT_BLOCKED") {
          setBlockedReason(parsed.reason ?? null);
          return;
        }
      } catch {
        // ignore parse errors
      }

      setError(t.authPages.invalidEmailOrPassword);
      return;
    }

    router.push("/projects");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border rounded-xl p-6"
      >
        <h1 className="text-xl font-semibold">{t.authPages.loginTitle}</h1>

        <div className="space-y-2">
          <label className="text-sm">{t.authPages.email}</label>
          <input
            className="w-full border rounded-md p-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">{t.authPages.password}</label>
          <input
            className="w-full border rounded-md p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="w-full border rounded-md p-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? t.authPages.signingIn : t.authPages.signIn}
        </button>

        <button
          type="button"
          className="w-full border rounded-md p-2 disabled:opacity-50"
          onClick={() => router.push("/register")}
        >
          {t.authPages.register}
        </button>
      </form>

      {blockedReason !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {t.authPages.blockedTitle}
                </h3>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.authPages.blockedMessage}
                </p>

                {blockedReason && (
                  <p className="text-sm text-red-700 whitespace-pre-wrap">
                    {t.authPages.blockedReasonLabel}: {blockedReason}
                  </p>
                )}

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.authPages.blockedContactMessage}
                </p>
              </div>

              <button
                type="button"
                className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                onClick={() => setBlockedReason(null)}
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionEnded && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {t.authPages.sessionEndedTitle}
                </h3>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {t.authPages.sessionEndedMessage}
                </p>
              </div>

              <button
                type="button"
                className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                onClick={() => setShowSessionEnded(false)}
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}