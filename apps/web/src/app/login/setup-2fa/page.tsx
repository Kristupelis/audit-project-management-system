"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SetupTwoFactorPage() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("userId");

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    async function setup() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        },
      );

      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.base32);
    }

    setup();
  }, [userId]);

  async function enable() {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/enable`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          secret,
          code,
        }),
      },
    );

    if (res.ok) {
      router.push("/login");
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Setup Two-Factor Authentication</h1>

      {qrCode && <img src={qrCode} className="w-64 border" />}

      <input
        className="border p-2"
        placeholder="Enter 6 digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button onClick={enable} className="border px-3 py-2">
        Enable 2FA
      </button>
    </main>
  );
}