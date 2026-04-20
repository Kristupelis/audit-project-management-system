"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/use-t";

type SetupResponse = {
  base32: string;
  qrCode: string;
};

type AuthResult = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    systemRole?: string | null;
    sessionVersion?: number | null;
  };
  accessToken: string;
  accessExpiresAt: number | null;
};

export default function TwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const userId = searchParams.get("userId");
  const email = searchParams.get("email") ?? "";
  const mode = searchParams.get("mode") ?? "verify";

  const isSetupMode = mode === "setup";

  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [loadingSetup, setLoadingSetup] = useState(isSetupMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSetup() {
      if (!isSetupMode || !userId) return;

      try {
        setLoadingSetup(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/setup`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          },
        );

        if (!res.ok) {
          setError(t.authPages.failedToLoad2faSetup);
          return;
        }

        const data: SetupResponse = await res.json();
        setSecret(data.base32);
        setQrCode(data.qrCode);
      } catch {
        setError(t.authPages.failedToLoad2faSetup);
      } finally {
        setLoadingSetup(false);
      }
    }

    void loadSetup();
  }, [isSetupMode, userId, t.authPages.failedToLoad2faSetup]);

  async function createSession(data: AuthResult) {
    const loginRes = await signIn("credentials", {
      redirect: false,
      userId: data.user.id,
      email: data.user.email,
      name: data.user.name ?? "",
      systemRole: data.user.systemRole ?? "",
      sessionVersion: String(data.user.sessionVersion ?? 0),
      accessToken: data.accessToken,
      accessExpiresAt: String(data.accessExpiresAt ?? ""),
    });

    if (loginRes?.error) {
      throw new Error("Session creation failed");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError(t.authPages.missingLoginSession);
      return;
    }

    if (isSetupMode && !secret) {
      setError(t.authPages.setupSecretNotLoaded);
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError(t.authPages.invalidAuthCode);
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = isSetupMode
        ? `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/enable`
        : `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/verify-login`;

      const body = isSetupMode
        ? { userId, secret, code }
        : { userId, code };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setError(t.authPages.invalidAuthCode);
        return;
      }

      const data: AuthResult = await res.json();
      await createSession(data);

      router.push("/projects");
      router.refresh();
    } catch {
      setError(
        isSetupMode
          ? t.authPages.setup2faFailed
          : t.authPages.verificationFailed,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border rounded-xl p-6"
      >
        <h1 className="text-xl font-semibold">
          {isSetupMode
            ? t.authPages.setup2faTitle
            : t.authPages.verify2faTitle}
        </h1>

        {isSetupMode ? (
          <>
            <p className="text-sm text-gray-600">
              {t.authPages.setup2faDescription}
            </p>

            {loadingSetup ? (
              <p className="text-sm text-gray-600">
                {t.authPages.loadingQrCode}
              </p>
            ) : qrCode ? (
              <div className="space-y-3">
                <img
                  src={qrCode}
                  alt="2FA QR code"
                  className="mx-auto h-48 w-48 border rounded-md"
                />
                <div className="rounded-md bg-gray-800 p-3 text-xs break-all">
                  <p className="font-medium mb-1">
                    {t.authPages.manualSetupKey}
                  </p>
                  <p>{secret}</p>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-gray-600">
            {t.authPages.accountLabel} {email || "your account"}.
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm">
            {isSetupMode
              ? t.authPages.confirmSetupCodeLabel
              : t.authPages.authCodeLabel}
          </label>
          <input
            className="w-full border rounded-md p-2 text-center tracking-widest"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="w-full border rounded-md p-2 disabled:opacity-50"
          disabled={submitting || loadingSetup}
        >
          {submitting
            ? isSetupMode
              ? t.authPages.finishingSetup
              : t.authPages.verifying
            : isSetupMode
              ? t.authPages.finishSetup
              : t.authPages.verify}
        </button>

        <button
          type="button"
          className="w-full border rounded-md p-2"
          onClick={() => router.push("/login")}
        >
          {t.authPages.backToLogin}
        </button>
      </form>
    </main>
  );
}