"use client";

import { useRouter } from "next/navigation";

export default function DeleteRoleButton({
  projectId,
  roleId,
}: {
  projectId: string;
  roleId: string;
}) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this role?")) return;

    const res = await fetch(`/api/projects/${projectId}/roles/${roleId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      className="border rounded-md px-3 py-1 text-sm text-red-600"
    >
      Delete
    </button>
  );
}