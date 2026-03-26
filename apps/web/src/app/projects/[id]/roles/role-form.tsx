"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
};

type AuditArea = {
  id: string;
  name: string;
  processes: {
    id: string;
    name: string;
  }[];
};

type PermissionRule = {
  resourceType: "PROJECT" | "AUDIT_AREA";
  auditAreaId?: string;
  processIds: string[];
  actions: ("READ" | "CREATE" | "UPDATE" | "DELETE")[];
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

export default function RoleForm({
  projectId,
  members,
  auditAreas,
  initialRole,
}: {
  projectId: string;
  members: Member[];
  auditAreas: AuditArea[];
  initialRole?: ExistingRole | null;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialRole?.name ?? "");
  const [description, setDescription] = useState(initialRole?.description ?? "");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    initialRole?.members?.map((m) => m.projectMember.id) ?? [],
  );

  const [rules, setRules] = useState<PermissionRule[]>([
    {
      resourceType: "PROJECT",
      processIds: [],
      actions: [],
    },
  ]);

  function addRule() {
    setRules((prev) => [
      ...prev,
      { resourceType: "PROJECT", processIds: [], actions: [] },
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

  function toggleAction(index: number, action: PermissionRule["actions"][number]) {
    setRules((prev) =>
      prev.map((rule, i) => {
        if (i !== index) return rule;
        const exists = rule.actions.includes(action);
        return {
          ...rule,
          actions: exists
            ? rule.actions.filter((a) => a !== action)
            : [...rule.actions, action],
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
    const result: { resource: string; action: string; scopeId?: string }[] = [];

    for (const rule of rules) {
      if (rule.resourceType === "PROJECT") {
        for (const action of rule.actions) {
          result.push({
            resource: "PROJECT",
            action,
          });
        }
      }

      if (rule.resourceType === "AUDIT_AREA" && rule.auditAreaId) {
        if (rule.processIds.length === 0) {
          for (const action of rule.actions) {
            result.push({
              resource: "PHASE",
              action,
              scopeId: rule.auditAreaId,
            });
          }
        } else {
          for (const processId of rule.processIds) {
            for (const action of rule.actions) {
              result.push({
                resource: "NODE",
                action,
                scopeId: processId,
              });
            }
          }
        }
      }
    }

    return result;
  }, [rules]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      alert(await res.text());
      return;
    }

    const role = await res.json();

    for (const memberId of selectedMembers) {
      await fetch(`/api/projects/${projectId}/members/${memberId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: role.id }),
      });
    }

    router.push(`/projects/${projectId}/roles`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">Role details</h2>

        <div className="space-y-1">
          <label className="text-sm">Role name</label>
          <input
            className="w-full border rounded-md p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Description</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Permission rules</h2>
          <button
            type="button"
            className="border rounded-md px-3 py-1"
            onClick={addRule}
          >
            + Add rule
          </button>
        </div>

        {rules.map((rule, index) => {
          const selectedAuditArea = auditAreas.find((a) => a.id === rule.auditAreaId);

          return (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="font-medium">Rule {index + 1}</div>
                {rules.length > 1 && (
                  <button
                    type="button"
                    className="text-red-600 text-sm"
                    onClick={() => removeRule(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm">Resource type</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={rule.resourceType}
                  onChange={(e) =>
                    updateRule(index, {
                      resourceType: e.target.value as "PROJECT" | "AUDIT_AREA",
                      auditAreaId: undefined,
                      processIds: [],
                    })
                  }
                >
                  <option value="PROJECT">Project</option>
                  <option value="AUDIT_AREA">Audit Area</option>
                </select>
              </div>

              {rule.resourceType === "AUDIT_AREA" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm">Audit area</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={rule.auditAreaId ?? ""}
                      onChange={(e) =>
                        updateRule(index, {
                          auditAreaId: e.target.value,
                          processIds: [],
                        })
                      }
                    >
                      <option value="">Select audit area</option>
                      {auditAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAuditArea && (
                    <div className="space-y-2">
                      <label className="text-sm">Processes</label>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={rule.processIds.includes("__ALL__")}
                            onChange={(e) =>
                              updateRule(index, {
                                processIds: e.target.checked ? ["__ALL__"] : [],
                              })
                            }
                          />
                          All processes in selected audit area
                        </label>

                        {!rule.processIds.includes("__ALL__") &&
                          selectedAuditArea.processes.map((process) => (
                            <label
                              key={process.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={rule.processIds.includes(process.id)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...rule.processIds, process.id]
                                    : rule.processIds.filter((id) => id !== process.id);

                                  updateRule(index, { processIds: next });
                                }}
                              />
                              {process.name}
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm">Actions</label>

                <div className="grid grid-cols-2 gap-2">
                  {(["READ", "CREATE", "UPDATE", "DELETE"] as const).map((action) => (
                    <label key={action} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={rule.actions.includes(action)}
                        onChange={() => toggleAction(index, action)}
                      />
                      {action}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">Assign members</h2>

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
          {initialRole ? "Update role" : "Create role"}
        </button>
      </div>
    </form>
  );
}