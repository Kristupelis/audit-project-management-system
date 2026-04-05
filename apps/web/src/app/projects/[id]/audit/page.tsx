import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";

type AuditLog = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: unknown;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

type AuditResponse = {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const actionOptions = [
  "MEMBER_ADDED",
  "MEMBER_ROLE_UPDATED",
  "MEMBER_REMOVED",
  "OWNER_TRANSFERRED",
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "ROLE_ASSIGNED_TO_MEMBER",
  "ROLE_REMOVED_FROM_MEMBER",
  "DIRECT_PERMISSION_GRANTED",
  "DIRECT_PERMISSION_REVOKED",
  "AUDIT_AREA_CREATED",
  "AUDIT_AREA_UPDATED",
  "AUDIT_AREA_DELETED",
  "PROCESS_CREATED",
  "PROCESS_UPDATED",
  "PROCESS_DELETED",
  "CONTROL_CREATED",
  "CONTROL_UPDATED",
  "CONTROL_DELETED",
  "TEST_STEP_CREATED",
  "TEST_STEP_UPDATED",
  "TEST_STEP_DELETED",
  "EVIDENCE_CREATED",
  "EVIDENCE_UPDATED",
  "EVIDENCE_DELETED",
  "FINDING_CREATED",
  "FINDING_UPDATED",
  "FINDING_DELETED",
];

const entityOptions = [
  "ProjectRole",
  "ProjectMemberRole",
  "ProjectMember",
  "AuditArea",
  "Process",
  "Control",
  "TestStep",
  "Evidence",
  "Finding",
  "Project",
];

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    action?: string;
    entity?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);

  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return <main className="p-6">{t.auth.notLoggedIn}</main>;
  }

  const page = sp.page ?? "1";
  const action = sp.action ?? "";
  const entity = sp.entity ?? "";

  const query = new URLSearchParams({
    page,
    pageSize: "30",
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
  });

  const audit = await apiFetch<AuditResponse>(
    `/projects/${id}/audit?${query.toString()}`,
    token,
  );

  function buildLink(nextPage: number) {
    const p = new URLSearchParams({
      page: String(nextPage),
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
    });

    return `/projects/${id}/audit?${p.toString()}`;
  }

  function actionLabel(value: string) {
    return t.audit.actions[value as keyof typeof t.audit.actions] ?? value;
  }

  function entityLabel(value: string) {
    return t.audit.entities[value as keyof typeof t.audit.entities] ?? value;
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href={`/projects/${id}`} className="underline text-sm">
          ← {t.rolesManagement.backToProject}
        </Link>
        <h1 className="text-2xl font-semibold mt-2">{t.audit.auditLogTitle}</h1>
      </div>

      <form className="border rounded-xl p-4 grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm">{t.audit.actionFilter}</label>
          <select
            name="action"
            defaultValue={action}
            className="w-full border rounded-md p-2"
          >
            <option value="">{t.audit.allActions}</option>
            {actionOptions.map((item) => (
              <option key={item} value={item}>
                {actionLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">{t.audit.entityFilter}</label>
          <select
            name="entity"
            defaultValue={entity}
            className="w-full border rounded-md p-2"
          >
            <option value="">{t.audit.allEntities}</option>
            {entityOptions.map((item) => (
              <option key={item} value={item}>
                {entityLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button className="border rounded-md px-4 py-2">
            {t.audit.applyFilters}
          </button>
          <Link
            href={`/projects/${id}/audit`}
            className="border rounded-md px-4 py-2"
          >
            {t.audit.resetFilters}
          </Link>
        </div>
      </form>

      <section className="border rounded-xl p-4 space-y-3">
        <div className="text-sm opacity-70">
          {t.audit.totalLogs} {audit.total}
        </div>

        {audit.items.length === 0 ? (
          <p className="text-sm opacity-70">{t.audit.noEntriesFound}</p>
        ) : (
          <ul className="space-y-2">
            {audit.items.map((a) => (
              <li key={a.id} className="border rounded-lg p-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{actionLabel(a.action)}</div>
                  <div className="text-xs opacity-70">
                    {a.entity
                      ? `${entityLabel(a.entity)}${a.entityId ? ` (${a.entityId})` : ""}`
                      : "—"}
                  </div>
                  <div className="text-xs opacity-60">
                    {new Date(a.createdAt).toLocaleString()} • {t.audit.actorLabel}{" "}
                    {a.actor?.name || a.actor?.email || t.audit.systemActor}
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer underline">
                      {t.audit.details}
                    </summary>
                    <pre className="mt-2 border rounded-md p-2 overflow-auto">
                      {JSON.stringify(a.details, null, 2)}
                    </pre>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Link
            href={buildLink(Math.max(audit.page - 1, 1))}
            className={`border rounded-md px-3 py-1 text-sm ${
              audit.page <= 1 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {t.audit.previous}
          </Link>

          <span className="text-sm">
            {t.audit.pageLabel} {audit.page} {t.audit.ofLabel} {audit.totalPages}
          </span>

          <Link
            href={buildLink(Math.min(audit.page + 1, audit.totalPages))}
            className={`border rounded-md px-3 py-1 text-sm ${
              audit.page >= audit.totalPages ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {t.audit.next}
          </Link>
        </div>
      </section>
    </main>
  );
}