"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
};

export default function DashboardClient({ session }: Props) {
  const router = useRouter();

  async function disconnect() {
    const first = window.confirm("Disconnect from session?");
    if (!first) return;

    const second = window.confirm("Are you sure? You will be redirected to login.");
    if (!second) return;

    // signOut clears NextAuth session cookie
    await signOut({ redirect: false });

    // redirect to login
    router.push("/login");
    router.refresh();
  }

  const name = session?.user?.name ?? "(no name)";
  const email = session?.user?.email ?? "(no email)";

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm opacity-80">
            Logged in as: <span className="font-medium">{name}</span> ({email})
          </p>
        </div>

        <button
          onClick={disconnect}
          className="border rounded-md px-3 py-2"
        >
          Disconnect
        </button>
      </div>

      <section className="border rounded-xl p-4">
        <h2 className="font-medium mb-2">Session (debug)</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(session, null, 2)}</pre>
      </section>
    </main>
  );
}
