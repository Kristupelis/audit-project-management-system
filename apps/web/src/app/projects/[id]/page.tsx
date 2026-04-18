import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import Members from "./members";
import ProjectStructureSection from "./project-structure-section";
import AuditPreview from "./audit-preview";
import DeleteProjectButton from "./delete-project-button";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";
import { withAuthRedirect } from "@/lib/with-auth-redirect";
import GenerateReportButton from "./generate-report-button";
import LockProjectButton from "./lock-project-button";
import ProjectLockWatcher from "./project-lock-watcher";

type Project = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  auditType: string;
  priority: string;
  isLocked: boolean;
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

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);

  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return (
      <main className="p-6">
        <p>{t.auth.notLoggedIn}</p>
        <Link className="underline" href="/login">
          {t.auth.login}
        </Link>
      </main>
    );
  }

  const project = await withAuthRedirect(
    apiFetch<Project>(`/projects/${id}`, token),
  );

  const canSeeAudit =
    project.isOwner || session?.user?.systemRole === "SUPER_ADMIN";

  const canManageProject =
    project.isOwner || session?.user?.systemRole === "SUPER_ADMIN";

  const statusLabel =
    t.enums.projectStatus[
      project.status as keyof typeof t.enums.projectStatus
    ] ?? project.status;

  const auditTypeLabel =
    t.enums.auditType[
      project.auditType as keyof typeof t.enums.auditType
    ] ?? project.auditType;

  const priorityLabel =
    t.enums.priority[
      project.priority as keyof typeof t.enums.priority
    ] ?? project.priority;

  return (
    <main className="p-6 space-y-6">
      <ProjectLockWatcher projectId={id} />
      
      <header className="space-y-4">
        <Link className="underline text-sm" href="/projects">
          ← {t.projects.backToProjects}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{project.name}</h1>

              <div className="flex flex-wrap gap-2 text-xs">
                {project.code && (
                  <span className="border rounded-full px-2 py-1">
                    {t.main.code} {project.code}
                  </span>
                )}
                <span className="border rounded-full px-2 py-1">
                  {t.projects.status}: {statusLabel}
                </span>
                <span className="border rounded-full px-2 py-1">
                  {t.projects.type}: {auditTypeLabel}
                </span>
                <span className="border rounded-full px-2 py-1">
                  {t.projects.priority}: {priorityLabel}
                </span>
                {project.isLocked && (
                  <span className="border rounded-full px-2 py-1 border-red-400 text-red-700">
                    {locale === "lt" ? "Užrakintas" : "Locked"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canManageProject && (
                <>
                  <Link href={`/projects/${id}/edit`}>
                    <button className="border px-3 py-1 rounded">
                      {t.projects.editProject}
                    </button>
                  </Link>

                  <DeleteProjectButton projectId={id} />

                  <GenerateReportButton
                    projectId={id}
                    label={t.projects.genReport}
                    errorTitle={t.common.error}
                    closeLabel={t.common.close}
                    loadingLabel={t.common.loading}
                  />
                  <LockProjectButton
                    projectId={id}
                    isLocked={project.isLocked}
                    lockLabel={locale === "lt" ? "Užrakinti projektą" : "Lock project"}
                    unlockLabel={locale === "lt" ? "Atrakinti projektą" : "Unlock project"}
                    loadingLabel={t.common.loading}
                    errorTitle={t.common.error}
                    closeLabel={t.common.close}
                  />
                </>
              )}
              

              {(project.isOwner || session?.user?.systemRole === "SUPER_ADMIN") && (
                <Link href={`/projects/${id}/roles`}>
                  <button className="border px-3 py-1 rounded">
                    {t.rolesPage.roles}
                  </button>
                </Link>
              )}
            </div>
          </div>

          <span className="text-xs border rounded-full px-2 py-1">
            {project.isOwner ? t.roles.owner : project.roles.join(", ") || t.roles.member}
          </span>
        </div>
      </header>

      <section className="border rounded-xl p-4 space-y-3">
        <h2 className="font-medium">{t.projects.projectDetails}</h2>

        {project.description && (
          <p className="text-sm opacity-80">
            <strong>{t.projects.description}:</strong> {project.description}
          </p>
        )}

        {project.scope && (
          <p className="text-sm opacity-80">
            <strong>{t.projects.scope}:</strong> {project.scope}
          </p>
        )}

        {project.objective && (
          <p className="text-sm opacity-80">
            <strong>{t.projects.objective}:</strong> {project.objective}
          </p>
        )}

        {project.methodology && (
          <p className="text-sm opacity-80">
            <strong>{t.projects.methodology}:</strong> {project.methodology}
          </p>
        )}

        <div className="grid gap-2 md:grid-cols-2 text-sm opacity-80">
          {project.auditedEntityName && (
            <div>
              <strong>{t.projects.auditedEntity}:</strong> {project.auditedEntityName}
            </div>
          )}

          {project.location && (
            <div>
              <strong>{t.projects.location}:</strong> {project.location}
            </div>
          )}

          {project.engagementLead && (
            <div>
              <strong>{t.projects.leadAuditor}:</strong> {project.engagementLead}
            </div>
          )}

          {(project.periodStart || project.periodEnd) && (
            <div>
              <strong>{t.projects.auditedPeriod}:</strong> {formatDate(project.periodStart)} -{" "}
              {formatDate(project.periodEnd)}
            </div>
          )}

          {project.plannedStartDate && (
            <div>
              <strong>{t.projects.plannedStartDate}:</strong> {formatDate(project.plannedStartDate)}
            </div>
          )}

          {project.plannedEndDate && (
            <div>
              <strong>{t.projects.plannedEndDate}:</strong> {formatDate(project.plannedEndDate)}
            </div>
          )}

          {project.actualStartDate && (
            <div>
              <strong>{t.projects.actualStartDate}:</strong> {formatDate(project.actualStartDate)}
            </div>
          )}

          {project.actualEndDate && (
            <div>
              <strong>{t.projects.actualEndDate}:</strong> {formatDate(project.actualEndDate)}
            </div>
          )}
        </div>

        <p className="text-xs opacity-60">
          {t.main.updated} {new Date(project.updatedAt).toLocaleString()}
        </p>
      </section>

      <Members projectId={id} />
      <ProjectStructureSection projectId={id} />
      {canSeeAudit && <AuditPreview projectId={id} />}
    </main>
  );
}