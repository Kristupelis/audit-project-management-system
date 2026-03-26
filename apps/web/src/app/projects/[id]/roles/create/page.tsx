import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import RoleForm from "../role-form";

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

export default async function CreateRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) return <main className="p-6">Not logged in.</main>;

  const project = await apiFetch<Project>(`/projects/${id}`, token);
  const membersData = await apiFetch<MembersResponse>(`/projects/${id}/members`, token);

  if (!project.isOwner) {
    return <main className="p-6">Only project owners can create roles.</main>;
  }

  const auditAreas: { id: string; name: string; processes: { id: string; name: string }[] }[] = [];

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href={`/projects/${id}/roles`} className="underline text-sm">
          ← Back to roles
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Create role</h1>
      </div>

      <RoleForm
        projectId={id}
        members={membersData.members}
        auditAreas={auditAreas}
      />
    </main>
  );
}