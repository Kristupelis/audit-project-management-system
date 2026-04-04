import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";

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
  "FINDING_DELETED"
];

const entityOptions = [
  "ProjectRole",
  "ProjectMemberRole",
  "ProjectMember",
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

  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return <main className="p-6">Not logged in.</main>;
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

  const audit = await apiFetch<AuditResponse>(`/projects/${id}/audit?${query.toString()}`, token);

  function buildLink(nextPage: number) {
    const p = new URLSearchParams({
      page: String(nextPage),
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
    });

    return `/projects/${id}/audit?${p.toString()}`;
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href={`/projects/${id}`} className="underline text-sm">
          ← Back to project
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Audit log</h1>
      </div>

      <form className="border rounded-xl p-4 grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm">Action</label>
          <select name="action" defaultValue={action} className="w-full border rounded-md p-2">
            <option value="">All actions</option>
            {actionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Entity</label>
          <select name="entity" defaultValue={entity} className="w-full border rounded-md p-2">
            <option value="">All entities</option>
            {entityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button className="border rounded-md px-4 py-2">Apply filters</button>
          <Link
            href={`/projects/${id}/audit`}
            className="border rounded-md px-4 py-2"
          >
            Reset
          </Link>
        </div>
      </form>

      <section className="border rounded-xl p-4 space-y-3">
        <div className="text-sm opacity-70">
          Total logs: {audit.total}
        </div>

        {audit.items.length === 0 ? (
          <p className="text-sm opacity-70">No audit entries found.</p>
        ) : (
          <ul className="space-y-2">
            {audit.items.map((a) => (
              <li key={a.id} className="border rounded-lg p-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{a.action}</div>
                  <div className="text-xs opacity-70">
                    {a.entity ? `${a.entity}${a.entityId ? ` (${a.entityId})` : ""}` : "—"}
                  </div>
                  <div className="text-xs opacity-60">
                    {new Date(a.createdAt).toLocaleString()} • actor:{" "}
                    {a.actor?.name || a.actor?.email || "system"}
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

        <div className="flex items-center gap-2 pt-2">
          <Link
            href={buildLink(Math.max(audit.page - 1, 1))}
            className={`border rounded-md px-3 py-1 text-sm ${
              audit.page <= 1 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Previous
          </Link>

          <span className="text-sm">
            Page {audit.page} of {audit.totalPages}
          </span>

          <Link
            href={buildLink(Math.min(audit.page + 1, audit.totalPages))}
            className={`border rounded-md px-3 py-1 text-sm ${
              audit.page >= audit.totalPages ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  );
}