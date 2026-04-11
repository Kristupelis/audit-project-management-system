import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import DeleteRoleButton from "./delete-role-button";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";
import { withAuthRedirect } from "@/lib/with-auth-redirect";

type RolePermission = {
  id: string;
  resource: string;
  action: string;
  scopeId: string | null;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermission[];
};

type Project = {
  id: string;
  name: string;
  isOwner: boolean;
  roles: string[];
};

export default async function RolesPage({
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
    return <main className="p-6">{t.rolesManagement.notLoggedIn}</main>;
  }

  const project = await withAuthRedirect(apiFetch<Project>(`/projects/${id}`, token));
  const roles = await withAuthRedirect(apiFetch<Role[]>(`/projects/${id}/roles`, token));

  const resourceLabel = (resource: string) => {
    const map: Record<string, string> = {
      PROJECT: t.rolesManagement.resourceProject,
      AUDIT_AREA: t.rolesManagement.resourceAuditArea,
      PROCESS: t.rolesManagement.resourceProcess,
      CONTROL: t.rolesManagement.resourceControl,
      TEST_STEP: t.rolesManagement.resourceTestStep,
      FINDING: t.rolesManagement.resourceFinding,
      EVIDENCE: t.rolesManagement.resourceEvidence,
    };

    return map[resource] ?? resource;
  };

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      READ: t.rolesManagement.actionView,
      CREATE: t.rolesManagement.actionCreate,
      UPDATE: t.rolesManagement.actionEdit,
      DELETE: t.rolesManagement.actionDelete,
    };

    return map[action] ?? action;
  };

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/projects/${id}`} className="underline text-sm">
            ← {t.rolesManagement.backToProject}
          </Link>
          <h1 className="text-2xl font-semibold mt-2">{t.rolesPage.roles}</h1>
        </div>

        {(project.isOwner || session?.user?.systemRole === "SUPER_ADMIN") && (
          <Link
            href={`/projects/${id}/roles/create`}
            className="border rounded-md px-3 py-2"
          >
            {t.rolesManagement.createRole}
          </Link>
        )}
      </div>

      {roles.length === 0 ? (
        <section className="border rounded-xl p-4">
          <p className="text-sm opacity-80">
            {t.rolesManagement.noRoles} {t.rolesManagement.noRolesHint}
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {roles.map((role) => (
            <li key={role.id} className="border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{role.name}</div>
                  {role.description && (
                    <div className="text-sm opacity-80">{role.description}</div>
                  )}
                </div>

                {(project.isOwner || session?.user?.systemRole === "SUPER_ADMIN") && (
                  <div className="flex gap-2">
                    <Link
                      href={`/projects/${id}/roles/${role.id}/edit`}
                      className="border rounded-md px-3 py-1 text-sm"
                    >
                      {t.common.edit}
                    </Link>

                    <DeleteRoleButton projectId={id} roleId={role.id} />
                  </div>
                )}
              </div>

              <div className="text-xs opacity-70">
                {role.permissions.map((p) => (
                  <div key={p.id}>
                    {actionLabel(p.action)} {resourceLabel(p.resource)}
                    {p.scopeId ? ` (${p.scopeId})` : ""}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}