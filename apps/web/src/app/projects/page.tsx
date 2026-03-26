import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import CreateProjectForm from "./create-project-form";
import ProjectsHeader from "./projects-header";
import SessionExpiryGuard from "./session-expiry-prompt";

type Project = {
  id: string;
  name: string;
  description?: string;
  isOwner: boolean;
  roles: string[];
  updatedAt: string;
};

async function fetchProjects(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
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
      <SessionExpiryGuard accessExpiresAt={session.apiAccessExpiresAt ?? null} />
      <ProjectsHeader name={session.user?.name} />


      {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}


      <section className="border rounded-xl p-4">
        <h2 className="font-medium mb-3">Create project</h2>
        <CreateProjectForm />
        </section>

      <ul className="space-y-2">
        {projects.map((p : Project) => (
            <li key={p.id} className="border rounded-xl">
            <Link
                href={`/projects/${p.id}`}
                className="block p-4 hover:bg-black/5 transition rounded-xl"
            >
                <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="font-medium underline">{p.name}</div>
                    {p.description && (
                    <p className="text-sm opacity-80">{p.description}</p>
                    )}
                    <p className="text-xs opacity-60">
                    Updated: {new Date(p.updatedAt).toLocaleString()}
                    </p>
                </div>

                <span className="text-xs border rounded-full px-2 py-1">
                  {p.isOwner ? "OWNER" : p.roles.join(", ") || "MEMBER"}
                </span>
                </div>
            </Link>
            </li>
            ))}
        </ul>

    </main>
  );
}
