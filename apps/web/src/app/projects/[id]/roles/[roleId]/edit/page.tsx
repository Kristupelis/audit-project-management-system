import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import RoleForm from "../../role-form";

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

type NodeType =
  | "AUDIT_AREA"
  | "PROCESS"
  | "CONTROL"
  | "TEST_STEP"
  | "FINDING"
  | "EVIDENCE";

type TreeNode = {
  id: string;
  nodeType: NodeType;
  label: string;
  parentId: string | null;
  children: TreeNode[];
};

type StructureResponse = {
  tree: TreeNode[];
};

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>;
}) {
  const { id, roleId } = await params;
  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) return <main className="p-6">Not logged in.</main>;

  const project = await apiFetch<Project>(`/projects/${id}`, token);
  const role = await apiFetch(`/projects/${id}/roles/${roleId}`, token);
  const membersData = await apiFetch<MembersResponse>(`/projects/${id}/members`, token);

  if (!project.isOwner) {
    return <main className="p-6">Only project owners can edit roles.</main>;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL missing");
  }

  const structureTree = await apiFetch<StructureResponse>(
    `/projects/${id}/structure`,
    token
  ).catch(() => ({ tree: [] }));

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href={`/projects/${id}/roles`} className="underline text-sm">
          ← Back to roles
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Edit role</h1>
      </div>

      <RoleForm
        projectId={id}
        members={membersData.members}
        structureTree={structureTree.tree}
        initialRole={role as undefined}
      />
    </main>
  );
}