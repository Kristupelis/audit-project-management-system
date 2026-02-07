import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  description?: string;
  role: string;
};

async function fetchProjects(token: string) {
  const res = await fetch("http://localhost:4000/projects", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.apiAccessToken) {
    return (
      <main className="p-6">
        <p>Not logged in.</p>
        <Link className="underline" href="/login">Login</Link>
      </main>
    );
  }

  const projects = await fetchProjects(session.apiAccessToken);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Projects</h1>

      <ul className="space-y-2">
        {projects.map((p: Project) => (
          <li key={p.id} className="border rounded-md p-3">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                {p.description && <div className="text-sm opacity-80">{p.description}</div>}
              </div>
              <div className="text-sm">{p.role}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
