import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import RoleForm from "../../role-form";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";

type Project = {
  id: string;
  name: string;
  isOwner: boolean;
};

type MembersResponse = {
  members: {
    id: string;
    user: {
      id: string;
      email: string;
      name?: string;
    };
  }[];
};

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>;
}) {
  const { id, roleId } = await params;

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);

  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) return <main className="p-6">{t.rolesManagement.notLoggedIn}</main>;

  const project = await apiFetch<Project>(`/projects/${id}`, token);
  const role = await apiFetch(`/projects/${id}/roles/${roleId}`, token);
  const membersData = await apiFetch<MembersResponse>(`/projects/${id}/members`, token);

  if (!project.isOwner && session?.user?.systemRole !== "SUPER_ADMIN") {
    return <main className="p-6">{t.rolesManagement.onlyOwnersCanEdit}</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href={`/projects/${id}/roles`} className="underline text-sm">
          ← {t.rolesManagement.backToRoles}
        </Link>
        <h1 className="text-2xl font-semibold mt-2">
          {t.rolesManagement.editRole}
        </h1>
      </div>

      <RoleForm
        projectId={id}
        members={membersData.members}
        initialRole={role as undefined}
      />
    </main>
  );
}