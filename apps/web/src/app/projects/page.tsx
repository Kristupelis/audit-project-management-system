import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import ProjectsHeader from "./projects-header";
import DeleteProjectButton from "./[id]/delete-project-button";

type Project = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  status?: string | null;
  auditType?: string | null;
  priority?: string | null;
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
        <Link className="underline" href="/login">
          Login
        </Link>
      </main>
    );
  }

  const projects = await fetchProjects(session.apiAccessToken);

  return (
    <main className="p-6 space-y-6">
      <ProjectsHeader name={session.user?.name} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium">Projects</h2>
          <p className="text-sm opacity-70">
            View existing audit projects or create a new one.
          </p>
        </div>

        <Link href="/projects/create" className="border rounded-md px-3 py-2">
          Create project
        </Link>
      </div>

      {projects.length === 0 ? (
        <section className="border rounded-xl p-4">
          <p className="text-sm opacity-80">There are no projects yet.</p>
        </section>
      ) : (
        <ul className="space-y-2">
          {projects.map((p: Project) => (
            <li key={p.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-medium underline"
                  >
                    {p.name}
                  </Link>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {p.code && (
                      <span className="border rounded-full px-2 py-1">
                        Code: {p.code}
                      </span>
                    )}
                    {p.status && (
                      <span className="border rounded-full px-2 py-1">
                        {p.status}
                      </span>
                    )}
                    {p.auditType && (
                      <span className="border rounded-full px-2 py-1">
                        {p.auditType}
                      </span>
                    )}
                    {p.priority && (
                      <span className="border rounded-full px-2 py-1">
                        {p.priority}
                      </span>
                    )}
                  </div>

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

              {(p.isOwner || session.user?.systemRole === "SUPER_ADMIN") && (
                <div className="flex gap-2">
                  <Link href={`/projects/${p.id}/edit`}>
                    <button className="border rounded-md px-3 py-1 text-sm">
                      Edit
                    </button>
                  </Link>

                  <DeleteProjectButton projectId={p.id} variant="list" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}