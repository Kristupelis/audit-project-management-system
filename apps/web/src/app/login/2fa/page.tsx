"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function TwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("Missing login session");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/verify-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            code,
          }),
        },
      );

      if (!res.ok) {
        setError("Invalid authentication code");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // create NextAuth session manually
      const loginRes = await signIn("credentials", {
        redirect: false,
        userId,
        email: data.user.email,
        accessToken: data.accessToken,
        });

      if (loginRes?.error) {
        setError("Session creation failed");
        setLoading(false);
        return;
      }

      router.push("/projects");
    } catch {
      setError("Verification failed");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border rounded-xl p-6"
      >
        <h1 className="text-xl font-semibold">Two-Factor Authentication</h1>

        <p className="text-sm text-gray-600">
          Enter the 6-digit code from your authenticator app.
        </p>

        <div className="space-y-2">
          <label className="text-sm">Authentication Code</label>
          <input
            className="w-full border rounded-md p-2 text-center tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="w-full border rounded-md p-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          className="w-full border rounded-md p-2"
          onClick={() => router.push("/login")}
        >
          Back to login
        </button>
      </form>
    </main>
  );
}