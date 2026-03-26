import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import Members from "./members";

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  roles: string[];
};

type AuditLog = {
  id: string;
  projectId: string;
  actorId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: unknown;
  createdAt: string;
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return (
      <main className="p-6">
        <p>You are not logged in.</p>
        <Link className="underline" href="/login">
          Go to login
        </Link>
      </main>
    );
  }

  const project = await apiFetch<Project>(`/projects/${id}`, token);
  const audit = await apiFetch<AuditLog[]>(`/projects/${id}/audit`, token);

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-2">
        <Link className="underline text-sm" href="/projects">
          ← Back to projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{project.name}</h1>

            <Members projectId={id} />
            <div className="space-y-1">
              <Link href={`/projects/${id}/roles`}>
                <button className="border px-3 py-1 rounded">Roles</button>
              </Link>
            </div>
            {project.description && (
              <p className="text-sm opacity-80">Project description: {project.description}</p>
            )}
            <p className="text-xs opacity-60">
              Updated: {new Date(project.updatedAt).toLocaleString()}
            </p>
          </div>

          <span className="text-xs border rounded-full px-2 py-1">
            {project.isOwner ? "OWNER" : project.roles.join(", ") || "MEMBER"}
          </span>
        </div>
      </header>

      <section className="border rounded-xl p-4 space-y-3">
        <h2 className="font-medium">Audit log (latest 100)</h2>

        {audit.length === 0 ? (
          <p className="text-sm opacity-70">No audit entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {audit.map((a) => (
              <li key={a.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{a.action}</div>
                    <div className="text-xs opacity-70">
                      {a.entity ? `${a.entity}${a.entityId ? ` (${a.entityId})` : ""}` : "—"}
                    </div>
                    <div className="text-xs opacity-60">
                      {new Date(a.createdAt).toLocaleString()} • actor: {a.actorId ?? "system"}
                    </div>
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer underline">details</summary>
                    <pre className="mt-2 border rounded-md p-2 overflow-auto">
                      {JSON.stringify(a.details, null, 2)}
                    </pre>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
