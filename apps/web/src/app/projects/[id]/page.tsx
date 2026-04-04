import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import Members from "./members";
import ProjectStructureSection from "./project-structure-section";
import AuditPreview from "./audit-preview";
import DeleteProjectButton from "./delete-project-button";

type Project = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  auditType: string;
  priority: string;
  scope: string | null;
  objective: string | null;
  methodology: string | null;
  auditedEntityName: string | null;
  location: string | null;
  engagementLead: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  roles: string[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

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

  const canSeeAudit =
    project.isOwner || session?.user?.systemRole === "SUPER_ADMIN";

  const canManageProject =
    project.isOwner || session?.user?.systemRole === "SUPER_ADMIN";

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-4">
        <Link className="underline text-sm" href="/projects">
          ← Back to projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{project.name}</h1>

              <div className="flex flex-wrap gap-2 text-xs">
                {project.code && (
                  <span className="border rounded-full px-2 py-1">
                    Code: {project.code}
                  </span>
                )}
                <span className="border rounded-full px-2 py-1">
                  Status: {project.status}
                </span>
                <span className="border rounded-full px-2 py-1">
                  Type: {project.auditType}
                </span>
                <span className="border rounded-full px-2 py-1">
                  Priority: {project.priority}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canManageProject && (
                <>
                  <Link href={`/projects/${id}/edit`}>
                    <button className="border px-3 py-1 rounded">
                      Edit project
                    </button>
                  </Link>

                  <DeleteProjectButton projectId={id} />
                </>
              )}

              {(project.isOwner || session?.user?.systemRole === "SUPER_ADMIN") && (
                <Link href={`/projects/${id}/roles`}>
                  <button className="border px-3 py-1 rounded">Roles</button>
                </Link>
              )}
            </div>
          </div>

          <span className="text-xs border rounded-full px-2 py-1">
            {project.isOwner ? "OWNER" : project.roles.join(", ") || "MEMBER"}
          </span>
        </div>
      </header>

      <section className="border rounded-xl p-4 space-y-3">
        <h2 className="font-medium">Project details</h2>

        {project.description && (
          <p className="text-sm opacity-80">
            <strong>Description:</strong> {project.description}
          </p>
        )}

        {project.scope && (
          <p className="text-sm opacity-80">
            <strong>Scope:</strong> {project.scope}
          </p>
        )}

        {project.objective && (
          <p className="text-sm opacity-80">
            <strong>Objective:</strong> {project.objective}
          </p>
        )}

        {project.methodology && (
          <p className="text-sm opacity-80">
            <strong>Methodology:</strong> {project.methodology}
          </p>
        )}

        <div className="grid gap-2 md:grid-cols-2 text-sm opacity-80">
          {project.auditedEntityName && (
            <div>
              <strong>Audited entity:</strong> {project.auditedEntityName}
            </div>
          )}

          {project.location && (
            <div>
              <strong>Location:</strong> {project.location}
            </div>
          )}

          {project.engagementLead && (
            <div>
              <strong>Lead auditor:</strong> {project.engagementLead}
            </div>
          )}

          {(project.periodStart || project.periodEnd) && (
            <div>
              <strong>Audited period:</strong> {formatDate(project.periodStart)} -{" "}
              {formatDate(project.periodEnd)}
            </div>
          )}

          {project.plannedStartDate && (
            <div>
              <strong>Planned start:</strong> {formatDate(project.plannedStartDate)}
            </div>
          )}

          {project.plannedEndDate && (
            <div>
              <strong>Planned end:</strong> {formatDate(project.plannedEndDate)}
            </div>
          )}

          {project.actualStartDate && (
            <div>
              <strong>Actual start:</strong> {formatDate(project.actualStartDate)}
            </div>
          )}

          {project.actualEndDate && (
            <div>
              <strong>Actual end:</strong> {formatDate(project.actualEndDate)}
            </div>
          )}
        </div>

        <p className="text-xs opacity-60">
          Updated: {new Date(project.updatedAt).toLocaleString()}
        </p>
      </section>

      <Members projectId={id} />
      <ProjectStructureSection projectId={id} />
      {canSeeAudit && <AuditPreview projectId={id} />}
    </main>
  );
}