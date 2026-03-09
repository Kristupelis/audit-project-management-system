"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Registration failed (${res.status})`);
      }

      // Auto sign-in after successful registration
      const login = await signIn("credentials", { email, password, redirect: false });
      if (login?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-xl p-6">
        <h1 className="text-xl font-semibold">Create account</h1>

        <div className="space-y-1">
          <label className="text-sm">Name</label>
          <input
            className="w-full border rounded-md p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input
            className="w-full border rounded-md p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Password (min 8)</label>
          <input
            className="w-full border rounded-md p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="w-full border rounded-md p-2 disabled:opacity-50" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
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
