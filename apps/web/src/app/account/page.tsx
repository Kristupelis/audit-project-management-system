/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/use-t";
import { useLanguage } from "@/providers/language-provider";
import { toUserFriendlyError } from "@/lib/error-message";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const t = useT();
  const { locale } = useLanguage();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = session?.apiAccessToken;

  useEffect(() => {
    setMsg(null);
  }, [qrCode]);

  async function setup2fa() {
    if (!token) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          toUserFriendlyError(text || t.accountPage.setupFailed, locale),
        );
      }

      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.base32);
    } catch (e) {
      setMsg(
        e instanceof Error ? e.message : toUserFriendlyError("", locale),
      );
    } finally {
      setLoading(false);
    }
  }

  async function enable2fa() {
    if (!token || !secret) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ secret, code }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          toUserFriendlyError(text || t.accountPage.enableFailed, locale),
        );
      }

      setMsg(t.accountPage.enabledSuccess);
      setCode("");
    } catch (e) {
      setMsg(
        e instanceof Error ? e.message : toUserFriendlyError("", locale),
      );
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <main className="p-6">{t.common.loading}</main>;
  }

  if (!session) {
    return <main className="p-6">{t.accountPage.pleaseLoginFirst}</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.accountPage.title}</h1>
        <p className="text-sm opacity-80">
          {t.accountPage.loggedInAs}{" "}
          <span className="font-medium">
            {session.user?.name ?? session.user?.email}
          </span>
        </p>
      </div>

      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">{t.accountPage.twoFactorTitle}</h2>

        {!qrCode ? (
          <button
            className="border rounded-md px-3 py-2 disabled:opacity-50"
            onClick={setup2fa}
            disabled={loading}
          >
            {loading ? t.accountPage.generating : t.accountPage.setup2fa}
          </button>
        ) : (
          <>
            <p className="text-sm opacity-80">
              {t.accountPage.scanQrDescription}
            </p>

            <img
              src={qrCode}
              alt="2FA QR code"
              className="w-56 h-56 border rounded-md"
            />

            <div className="text-xs opacity-70 break-all">
              <div className="font-medium">{t.accountPage.secretLabel}</div>
              <div>{secret}</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm">{t.accountPage.enterCode}</label>
              <input
                className="border rounded-md p-2 w-48"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </div>

            <button
              className="border rounded-md px-3 py-2 disabled:opacity-50"
              onClick={enable2fa}
              disabled={loading || code.length < 6}
            >
              {loading ? t.accountPage.enabling : t.accountPage.enable2fa}
            </button>
          </>
        )}

        {msg && <p className="text-sm">{msg}</p>}
      </section>
    </main>
  );
}