"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toUserFriendlyError } from "@/lib/error-message";
import { useLanguage } from "@/providers/language-provider";
import { useT } from "@/i18n/use-t";

type Member = {
  id: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
};

type NodeType =
  | "AUDIT_AREA"
  | "PROCESS"
  | "CONTROL"
  | "TEST_STEP"
  | "FINDING"
  | "EVIDENCE";

type ResourceType =
  | "PROJECT"
  | "AUDIT_AREA"
  | "PROCESS"
  | "CONTROL"
  | "TEST_STEP"
  | "FINDING"
  | "EVIDENCE";

type PermissionAction = "READ" | "CREATE" | "UPDATE" | "DELETE";

type TreeNode = {
  id: string;
  nodeType: NodeType;
  label: string;
  parentId: string | null;
  children: TreeNode[];
  canRead?: boolean;
  data?: unknown | null;
};

type PermissionRule = {
  resource: ResourceType;
  scopedMode: "ALL" | "SPECIFIC";
  scopeId?: string;
  actions: PermissionAction[];
};

type ExistingRole = {
  id: string;
  name: string;
  description: string | null;
  permissions: {
    id: string;
    resource: string;
    action: string;
    scopeId: string | null;
  }[];
  members?: {
    projectMember: {
      id: string;
      user: {
        id: string;
        email: string;
      };
    };
  }[];
};

type StructureResponse = {
  tree: TreeNode[];
};

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    out.push(node);
    out.push(...flattenTree(node.children));
  }
  return out;
}

function buildInitialRules(
  permissions: ExistingRole["permissions"] | undefined,
): PermissionRule[] {
  if (!permissions || permissions.length === 0) {
    return [
      {
        resource: "PROJECT",
        scopedMode: "ALL",
        actions: [],
      },
    ];
  }

  const grouped = new Map<string, PermissionRule>();

  for (const permission of permissions) {
    const resource = permission.resource as ResourceType;
    const scopedMode = permission.scopeId ? "SPECIFIC" : "ALL";
    const key = `${resource}::${scopedMode}::${permission.scopeId ?? "ALL"}`;

    const existing = grouped.get(key);
    if (existing) {
      if (!existing.actions.includes(permission.action as PermissionAction)) {
        existing.actions.push(permission.action as PermissionAction);
      }
      continue;
    }

    grouped.set(key, {
      resource,
      scopedMode,
      scopeId: permission.scopeId ?? undefined,
      actions: [permission.action as PermissionAction],
    });
  }

  return Array.from(grouped.values());
}

export default function RoleForm({
  projectId,
  members,
  initialRole,
}: {
  projectId: string;
  members: Member[];
  initialRole?: ExistingRole | null;
}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = useT();

  const [name, setName] = useState(initialRole?.name ?? "");
  const [description, setDescription] = useState(initialRole?.description ?? "");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    initialRole?.members?.map((m) => m.projectMember.id) ?? [],
  );

  const [structureTree, setStructureTree] = useState<TreeNode[]>([]);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [rules, setRules] = useState<PermissionRule[]>(
    buildInitialRules(initialRole?.permissions),
  );

  const allNodes = useMemo(() => flattenTree(structureTree), [structureTree]);

  const resourceOptions: ResourceType[] = [
    "PROJECT",
    "AUDIT_AREA",
    "PROCESS",
    "CONTROL",
    "TEST_STEP",
    "FINDING",
    "EVIDENCE",
  ];

  const actionLabels: Record<PermissionAction, string> = {
    READ: t.rolesManagement.actionView,
    CREATE: t.rolesManagement.actionCreate,
    UPDATE: t.rolesManagement.actionEdit,
    DELETE: t.rolesManagement.actionDelete,
  };

  function resourceLabel(resource: ResourceType) {
    switch (resource) {
      case "PROJECT":
        return t.rolesManagement.resourceProject;
      case "AUDIT_AREA":
        return t.rolesManagement.resourceAuditArea;
      case "PROCESS":
        return t.rolesManagement.resourceProcess;
      case "CONTROL":
        return t.rolesManagement.resourceControl;
      case "TEST_STEP":
        return t.rolesManagement.resourceTestStep;
      case "FINDING":
        return t.rolesManagement.resourceFinding;
      case "EVIDENCE":
        return t.rolesManagement.resourceEvidence;
    }
  }

  useEffect(() => {
    async function loadStructure() {
      try {
        const res = await fetch(`/api/projects/${projectId}/structure`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            toUserFriendlyError(
              text || t.rolesManagement.loadStructureFailed,
              locale,
            ),
          );
        }

        const data = (await res.json()) as StructureResponse;
        setStructureTree(data.tree);
      } catch (error) {
        setStructureError(
          error instanceof Error
            ? error.message
            : t.rolesManagement.loadStructureFailed,
        );
      }
    }

    void loadStructure();
  }, [projectId, locale, t.rolesManagement.loadStructureFailed]);

  function addRule() {
    setRules((prev) => [
      ...prev,
      {
        resource: "PROJECT",
        scopedMode: "ALL",
        actions: [],
      },
    ]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRule(index: number, patch: Partial<PermissionRule>) {
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
    );
  }

  function toggleAction(index: number, action: PermissionAction) {
    setRules((prev) =>
      prev.map((rule, i) => {
        if (i !== index) return rule;

        const actions = new Set(rule.actions);
        const hasAction = actions.has(action);

        if (hasAction) {
          actions.delete(action);

          if (action === "READ") {
            actions.delete("CREATE");
            actions.delete("UPDATE");
            actions.delete("DELETE");
          }

          if (action === "UPDATE") {
            actions.delete("DELETE");
          }

          return {
            ...rule,
            actions: Array.from(actions),
          };
        }

        actions.add(action);

        if (action === "UPDATE") {
          actions.add("READ");
        }

        if (action === "DELETE") {
          actions.add("READ");
          actions.add("UPDATE");
        }

        if (action === "CREATE") {
          actions.add("READ");
          actions.add("UPDATE");
        }

        return {
          ...rule,
          actions: Array.from(actions),
        };
      }),
    );
  }

  function toggleMember(memberId: string) {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  }

  const payloadPermissions = useMemo(() => {
    const result: {
      resource: ResourceType;
      action: PermissionAction;
      scopeId?: string;
    }[] = [];

    for (const rule of rules) {
      for (const action of rule.actions) {
        if (rule.resource === "PROJECT") {
          result.push({
            resource: "PROJECT",
            action,
          });
          continue;
        }

        if (rule.scopedMode === "ALL") {
          result.push({
            resource: rule.resource,
            action,
          });
        } else if (rule.scopeId) {
          result.push({
            resource: rule.resource,
            action,
            scopeId: rule.scopeId,
          });
        }
      }
    }

    return result;
  }, [rules]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const isEdit = Boolean(initialRole?.id);
    const url = isEdit
      ? `/api/projects/${projectId}/roles/${initialRole!.id}`
      : `/api/projects/${projectId}/roles`;

    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || null,
        permissions: payloadPermissions,
      }),
    });

    if (!res.ok) {
      setFormError(toUserFriendlyError(await res.text(), locale));
      return;
    }

    const role = await res.json();

    const initialMemberIds = new Set(
      initialRole?.members?.map((m) => m.projectMember.id) ?? [],
    );
    const nextMemberIds = new Set(selectedMembers);

    const membersToAdd = [...nextMemberIds].filter((id) => !initialMemberIds.has(id));
    const membersToRemove = [...initialMemberIds].filter((id) => !nextMemberIds.has(id));

    for (const memberId of membersToAdd) {
      const assignRes = await fetch(`/api/projects/${projectId}/members/${memberId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: role.id }),
      });

      if (!assignRes.ok) {
        setFormError(toUserFriendlyError(await assignRes.text(), locale));
        return;
      }
    }

    for (const memberId of membersToRemove) {
      const removeRes = await fetch(
        `/api/projects/${projectId}/members/${memberId}/roles/${role.id}`,
        {
          method: "DELETE",
        },
      );

      if (!removeRes.ok) {
        setFormError(toUserFriendlyError(await removeRes.text(), locale));
        return;
      }
    }

    router.push(`/projects/${projectId}/roles`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">{t.rolesManagement.roleDetails}</h2>

        <div className="space-y-1">
          <label className="text-sm">{t.rolesManagement.roleName}</label>
          <input
            className="w-full border rounded-md p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">{t.projects.description}</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      {structureError && (
        <div className="border rounded p-3 text-sm bg-red-50 border-red-300 text-red-700">
          {structureError}
        </div>
      )}

      {formError && (
        <div className="border rounded p-3 text-sm bg-red-50 border-red-300 text-red-700">
          {formError}
        </div>
      )}

      <section className="border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{t.rolesManagement.permissionRules}</h2>
          <button
            type="button"
            className="border rounded-md px-3 py-1"
            onClick={addRule}
          >
            + {t.rolesManagement.addRule}
          </button>
        </div>

        {rules.map((rule, index) => {
          const scopeOptions =
            rule.resource === "PROJECT"
              ? []
              : allNodes.filter((node) => node.nodeType === rule.resource);

          return (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="font-medium">
                  {t.rolesManagement.rule} {index + 1}
                </div>
                {rules.length > 1 && (
                  <button
                    type="button"
                    className="text-red-600 text-sm"
                    onClick={() => removeRule(index)}
                  >
                    {t.rolesManagement.removeRule}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm">{t.rolesManagement.resourceType}</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={rule.resource}
                  onChange={(e) =>
                    updateRule(index, {
                      resource: e.target.value as ResourceType,
                      scopedMode: "ALL",
                      scopeId: undefined,
                    })
                  }
                >
                  {resourceOptions.map((resource) => (
                    <option key={resource} value={resource}>
                      {resourceLabel(resource)}
                    </option>
                  ))}
                </select>
              </div>

              {rule.resource !== "PROJECT" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm">{t.rolesManagement.scopeMode}</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={rule.scopedMode}
                      onChange={(e) =>
                        updateRule(index, {
                          scopedMode: e.target.value as "ALL" | "SPECIFIC",
                          scopeId: undefined,
                        })
                      }
                    >
                      <option value="ALL">
                        {t.rolesManagement.allScope}{" "}
                        {resourceLabel(rule.resource).toLowerCase()}s
                      </option>
                      <option value="SPECIFIC">
                        {t.rolesManagement.specificScope}{" "}
                        {resourceLabel(rule.resource).toLowerCase()}
                      </option>
                    </select>
                  </div>

                  {rule.scopedMode === "SPECIFIC" && (
                    <div className="space-y-1">
                      <label className="text-sm">
                        {t.rolesManagement.selectItem}{" "}
                        {resourceLabel(rule.resource).toLowerCase()}
                      </label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={rule.scopeId ?? ""}
                        onChange={(e) =>
                          updateRule(index, {
                            scopeId: e.target.value || undefined,
                          })
                        }
                        required
                      >
                        <option value="">{t.rolesManagement.selectItem}</option>
                        {scopeOptions.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm">{t.rolesManagement.actions}</label>

                <div className="grid grid-cols-2 gap-2">
                  {(["READ", "CREATE", "UPDATE", "DELETE"] as const).map((action) => (
                    <label key={action} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={rule.actions.includes(action)}
                        onChange={() => toggleAction(index, action)}
                      />
                      {actionLabels[action]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">{t.rolesManagement.assignMembers}</h2>

        <div className="space-y-2">
          {members.map((member) => (
            <label key={member.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedMembers.includes(member.id)}
                onChange={() => toggleMember(member.id)}
              />
              {member.user.name || member.user.email}
            </label>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <button className="border rounded-md px-4 py-2">
          {initialRole ? t.rolesManagement.updateRole : t.rolesManagement.createRole}
        </button>
      </div>
    </form>
  );
}