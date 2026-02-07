import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

async function fetchMe(token: string) {
  const res = await fetch("http://localhost:4000/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.apiAccessToken) {
    return <p className="p-6">Not authenticated</p>;
  }

  const me = await fetchMe(session.apiAccessToken);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <section>
        <h2 className="font-medium">Session</h2>
        <pre className="border rounded-md p-3 overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="font-medium">/auth/me response</h2>
        <pre className="border rounded-md p-3 overflow-auto">
          {JSON.stringify(me, null, 2)}
        </pre>
      </section>
    </main>
  );
}
