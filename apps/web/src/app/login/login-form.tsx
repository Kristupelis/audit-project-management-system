"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/i18n/use-t";

export default function LoginPage() {
  const router = useRouter();
  const t = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBlockedMessage(null);
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

    if (res.error?.startsWith("BLOCKED:")) {
      const reason = res.error.slice("BLOCKED:".length).trim();

      setBlockedMessage(
        `Your account is blocked.${reason ? ` Reason: ${reason}.` : ""} For unblock requests, contact ckristupas@gmail.com.`,
      );
      return;
    }

    if (res.error) {
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
      {blockedMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-red-700 bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-red-700">Account blocked</h2>
            <p className="text-sm text-red-700">{blockedMessage}</p>
            <button
              type="button"
              className="w-full rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
              onClick={() => setBlockedMessage(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}