import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import DeleteRoleButton from "./delete-role-button";

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
  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return <main className="p-6">Not logged in.</main>;
  }

  const project = await apiFetch<Project>(`/projects/${id}`, token);
  const roles = await apiFetch<Role[]>(`/projects/${id}/roles`, token);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/projects/${id}`} className="underline text-sm">
            ← Back to project
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Roles</h1>
        </div>

        {project.isOwner && (
          <Link
            href={`/projects/${id}/roles/create`}
            className="border rounded-md px-3 py-2"
          >
            Create role
          </Link>
        )}
      </div>

      {roles.length === 0 ? (
        <section className="border rounded-xl p-4">
          <p className="text-sm opacity-80">
            There are no roles created. If you want to create a role, press
            &quot;Create role&quot;.
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

                {project.isOwner && (
                  <div className="flex gap-2">
                    <Link
                      href={`/projects/${id}/roles/${role.id}/edit`}
                      className="border rounded-md px-3 py-1 text-sm"
                    >
                      Edit
                    </Link>

                    <DeleteRoleButton
                        projectId={id}
                        roleId={role.id}
                      />
                  </div>
                )}
              </div>

              <div className="text-xs opacity-70">
                {role.permissions.map((p) => (
                  <div key={p.id}>
                    {p.action} {p.resource}
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