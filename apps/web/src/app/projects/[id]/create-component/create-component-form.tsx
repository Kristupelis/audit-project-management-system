"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toUserFriendlyError } from "@/lib/error-message";

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

function flatten(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    out.push(node);
    out.push(...flatten(node.children));
  }
  return out;
}

function parentTypeFor(nodeType: NodeType): NodeType | null {
  switch (nodeType) {
    case "AUDIT_AREA":
      return null;
    case "PROCESS":
      return "AUDIT_AREA";
    case "CONTROL":
      return "PROCESS";
    case "TEST_STEP":
      return "CONTROL";
    case "FINDING":
    case "EVIDENCE":
      return "PROCESS";
  }
}

function typeLabel(type: NodeType) {
  switch (type) {
    case "AUDIT_AREA":
      return "Audit area";
    case "PROCESS":
      return "Process";
    case "CONTROL":
      return "Control";
    case "TEST_STEP":
      return "Test step";
    case "FINDING":
      return "Finding";
    case "EVIDENCE":
      return "Evidence";
  }
}

export default function CreateComponentForm({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [nodeType, setNodeType] = useState<NodeType>("AUDIT_AREA");
  const [parentId, setParentId] = useState("");
  const [form, setForm] = useState<Record<string, string>>({ name: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allNodes = useMemo(() => flatten(tree), [tree]);
  const requiredParentType = parentTypeFor(nodeType);

  const parentOptions = useMemo(() => {
    if (!requiredParentType) return [];
    return allNodes.filter((node) => node.nodeType === requiredParentType);
  }, [allNodes, requiredParentType]);

  useEffect(() => {
    async function loadStructure() {
      try {
        const res = await fetch(`/api/projects/${projectId}/structure`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(toUserFriendlyError(text || "Failed to load projectstructure."));
        }

        const data = (await res.json()) as StructureResponse;
        setTree(data.tree);
      } catch (e) {
        setError(
          e instanceof Error ? toUserFriendlyError(e.message) : "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStructure();
  }, [projectId]);

  useEffect(() => {
    setParentId("");

    switch (nodeType) {
      case "AUDIT_AREA":
      case "PROCESS":
      case "CONTROL":
        setForm({ name: "" });
        break;
      case "TEST_STEP":
        setForm({ description: "" });
        break;
      case "FINDING":
        setForm({ title: "", description: "", severity: "" });
        break;
      case "EVIDENCE":
        setForm({ title: "", type: "", fileUrl: "" });
        break;
    }
  }, [nodeType]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload =
        nodeType === "AUDIT_AREA" || nodeType === "PROCESS" || nodeType === "CONTROL"
          ? { name: form.name ?? "" }
          : nodeType === "TEST_STEP"
          ? { description: form.description ?? "" }
          : nodeType === "FINDING"
          ? {
              title: form.title ?? "",
              description: form.description ?? "",
              severity: form.severity ?? "",
            }
          : {
              title: form.title ?? "",
              type: form.type ?? "",
              fileUrl: form.fileUrl?.trim() ? form.fileUrl.trim() : undefined,
            };

      const res = await fetch(`/api/projects/${projectId}/structure/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeType,
          parentId: parentId || null,
          payload,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(toUserFriendlyError(text || "Failed to create component."));
      }

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? toUserFriendlyError(e.message) : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border rounded-xl p-4 max-w-2xl space-y-4">
      {error && (
        <div className="border rounded p-3 text-sm bg-red-50 border-red-300 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm">Component type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as NodeType)}
          >
            <option value="AUDIT_AREA">{typeLabel("AUDIT_AREA")}</option>
            <option value="PROCESS">{typeLabel("PROCESS")}</option>
            <option value="CONTROL">{typeLabel("CONTROL")}</option>
            <option value="TEST_STEP">{typeLabel("TEST_STEP")}</option>
            <option value="FINDING">{typeLabel("FINDING")}</option>
            <option value="EVIDENCE">{typeLabel("EVIDENCE")}</option>
          </select>
        </div>

        {requiredParentType && (
          <div className="space-y-1">
            <label className="block text-sm">
              Parent {typeLabel(requiredParentType).toLowerCase()}
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select parent</option>
              {parentOptions.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {(nodeType === "AUDIT_AREA" ||
          nodeType === "PROCESS" ||
          nodeType === "CONTROL") && (
          <div className="space-y-1">
            <label className="block text-sm">Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.name ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
        )}

        {nodeType === "TEST_STEP" && (
          <div className="space-y-1">
            <label className="block text-sm">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-24"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />
          </div>
        )}

        {nodeType === "FINDING" && (
          <>
            <div className="space-y-1">
              <label className="block text-sm">Title</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.title ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-24"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm">Severity</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.severity ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, severity: e.target.value }))
                }
                required
              />
            </div>
          </>
        )}

        {nodeType === "EVIDENCE" && (
          <>
            <div className="space-y-1">
              <label className="block text-sm">Title</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.title ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm">Type</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.type ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm">File URL</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.fileUrl ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fileUrl: e.target.value }))
                }
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button className="border rounded px-3 py-2" disabled={submitting}>
            {submitting ? "Creating..." : "Create component"}
          </button>

          <button
            type="button"
            className="border rounded px-3 py-2"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}