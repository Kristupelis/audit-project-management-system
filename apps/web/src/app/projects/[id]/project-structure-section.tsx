"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toUserFriendlyError } from "@/lib/error-message";

type NodeType =
  | "AUDIT_AREA"
  | "PROCESS"
  | "CONTROL"
  | "TEST_STEP"
  | "FINDING"
  | "EVIDENCE";

type AuditAreaData = {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: string;
};

type ProcessData = {
  id: string;
  auditAreaId: string;
  name: string;
  order: number;
  createdAt: string;
};

type ControlData = {
  id: string;
  processId: string;
  name: string;
  order: number;
  createdAt: string;
};

type TestStepData = {
  id: string;
  controlId: string;
  description: string;
  order: number;
  createdAt: string;
};

type FindingData = {
  id: string;
  processId: string;
  title: string;
  description: string;
  severity: string;
  order: number;
  createdAt: string;
};

type EvidenceData = {
  id: string;
  processId: string;
  title: string;
  type: string;
  fileUrl?: string | null;
  order: number;
  createdAt: string;
};

type TreeNode =
  | {
      id: string;
      nodeType: "AUDIT_AREA";
      label: string;
      parentId: null;
      children: TreeNode[];
      canRead: boolean;
      data: AuditAreaData | null;
    }
  | {
      id: string;
      nodeType: "PROCESS";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: ProcessData | null;
    }
  | {
      id: string;
      nodeType: "CONTROL";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: ControlData | null;
    }
  | {
      id: string;
      nodeType: "TEST_STEP";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: TestStepData | null;
    }
  | {
      id: string;
      nodeType: "FINDING";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: FindingData | null;
    }
  | {
      id: string;
      nodeType: "EVIDENCE";
      label: string;
      parentId: string;
      children: TreeNode[];
      canRead: boolean;
      data: EvidenceData | null;
    };

type StructureResponse = {
  tree: TreeNode[];
};

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

function allowedChildTypes(type: NodeType): NodeType[] {
  switch (type) {
    case "AUDIT_AREA":
      return ["PROCESS"];
    case "PROCESS":
      return ["CONTROL", "FINDING", "EVIDENCE"];
    case "CONTROL":
      return ["TEST_STEP"];
    default:
      return [];
  }
}

function getNodeEditPayload(node: TreeNode, form: Record<string, string>) {
  switch (node.nodeType) {
    case "AUDIT_AREA":
    case "PROCESS":
    case "CONTROL":
      return { name: form.name ?? "" };
    case "TEST_STEP":
      return { description: form.description ?? "" };
    case "FINDING":
      return {
        title: form.title ?? "",
        description: form.description ?? "",
        severity: form.severity ?? "",
      };
    case "EVIDENCE":
      return {
        title: form.title ?? "",
        type: form.type ?? "",
        fileUrl: form.fileUrl?.trim() ? form.fileUrl.trim() : undefined,
      };
  }
}

function buildInitialForm(node: TreeNode): Record<string, string> {
  if (!node.data) return {};

  switch (node.nodeType) {
    case "AUDIT_AREA":
    case "PROCESS":
    case "CONTROL":
      return { name: node.data.name };
    case "TEST_STEP":
      return { description: node.data.description };
    case "FINDING":
      return {
        title: node.data.title,
        description: node.data.description,
        severity: node.data.severity,
      };
    case "EVIDENCE":
      return {
        title: node.data.title,
        type: node.data.type,
        fileUrl: node.data.fileUrl ?? "",
      };
  }
}

function collectExpandedIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    ids.push(...collectExpandedIds(node.children));
  }
  return ids;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    out.push(node);
    out.push(...flattenTree(node.children));
  }
  return out;
}

function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findNodeById(node.children, id);
    if (child) return child;
  }
  return null;
}

function ErrorModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-red-700">Error</h3>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{message}</p>
          </div>

          <button
            className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  node,
  onCancel,
  onConfirm,
  loading,
}: {
  node: TreeNode;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-red-700">
              Confirm deletion
            </h3>

            <p className="text-sm text-red-700 whitespace-pre-wrap">
              Delete <strong>{node.label}</strong>?
            </p>

            <p className="text-sm text-red-700 whitespace-pre-wrap">
              All related child components of this component will also be deleted.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeItem({
  node,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: TreeNode;
  expanded: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <li className="space-y-1">
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
          isSelected ? "border bg-black/5" : ""
        }`}
      >
        <button
          type="button"
          className="w-6"
          onClick={() => hasChildren && onToggle(node.id)}
        >
          {hasChildren ? (isExpanded ? "−" : "+") : "•"}
        </button>

        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => onSelect(node)}
        >
          <span className="font-medium">{node.label}</span>
          <span className="ml-2 text-xs opacity-60">
            {typeLabel(node.nodeType)}
          </span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="ml-5 pl-3 border-l space-y-1">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function CreateChildForm({
  projectId,
  parent,
  onSuccess,
  onCancel,
  onError,
}: {
  projectId: string;
  parent: TreeNode;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const childTypes = allowedChildTypes(parent.nodeType);
  const [nodeType, setNodeType] = useState<NodeType>(childTypes[0]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    switch (nodeType) {
      case "PROCESS":
      case "CONTROL":
      case "AUDIT_AREA":
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
      const res = await fetch(`/api/projects/${projectId}/structure/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeType,
          parentId: parent.id,
          payload:
            nodeType === "PROCESS" || nodeType === "CONTROL" || nodeType === "AUDIT_AREA"
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
                },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(toUserFriendlyError(text || "Failed to create component."));
      }

      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-3">
      <h4 className="font-medium">Add child component</h4>

      <div className="space-y-1">
        <label className="block text-sm">Component type</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value as NodeType)}
        >
          {childTypes.map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      {(nodeType === "PROCESS" || nodeType === "CONTROL" || nodeType === "AUDIT_AREA") && (
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
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
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
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm">Type</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.type ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
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
          {submitting ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function DetailFields({
  node,
  editing,
  form,
  setForm,
}: {
  node: TreeNode;
  editing: boolean;
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  if (!node.data) {
    return null;
  }

  if (node.nodeType === "AUDIT_AREA" || node.nodeType === "PROCESS" || node.nodeType === "CONTROL") {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium">Name</label>
        {editing ? (
          <input
            className="w-full border rounded px-3 py-2"
            value={form.name ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        ) : (
          <p className="text-sm opacity-80">{node.data.name}</p>
        )}
      </div>
    );
  }

  if (node.nodeType === "TEST_STEP") {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium">Description</label>
        {editing ? (
          <textarea
            className="w-full border rounded px-3 py-2 min-h-28"
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        ) : (
          <p className="text-sm opacity-80 whitespace-pre-wrap">
            {node.data.description}
          </p>
        )}
      </div>
    );
  }

  if (node.nodeType === "FINDING") {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Title</label>
          {editing ? (
            <input
              className="w-full border rounded px-3 py-2"
              value={form.title ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          ) : (
            <p className="text-sm opacity-80">{node.data.title}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Description</label>
          {editing ? (
            <textarea
              className="w-full border rounded px-3 py-2 min-h-28"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          ) : (
            <p className="text-sm opacity-80 whitespace-pre-wrap">
              {node.data.description}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Severity</label>
          {editing ? (
            <input
              className="w-full border rounded px-3 py-2"
              value={form.severity ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, severity: e.target.value }))
              }
            />
          ) : (
            <p className="text-sm opacity-80">{node.data.severity}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="block text-sm font-medium">Title</label>
        {editing ? (
          <input
            className="w-full border rounded px-3 py-2"
            value={form.title ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
        ) : (
          <p className="text-sm opacity-80">{node.data.title}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Type</label>
        {editing ? (
          <input
            className="w-full border rounded px-3 py-2"
            value={form.type ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          />
        ) : (
          <p className="text-sm opacity-80">{node.data.type}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">File URL</label>
        {editing ? (
          <input
            className="w-full border rounded px-3 py-2"
            value={form.fileUrl ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fileUrl: e.target.value }))
            }
          />
        ) : (
          <p className="text-sm opacity-80 break-all">
            {node.data.fileUrl || "No file URL"}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProjectStructureSection({
  projectId,
}: {
  projectId: string;
}) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [showDelete, setShowDelete] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => (selectedId ? findNodeById(tree, selectedId) : null),
    [tree, selectedId]
  );

  async function loadTree() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/structure`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(toUserFriendlyError(text || "Failed to create component."));
      }

      const data = (await res.json()) as StructureResponse;
      setTree(data.tree);
      setExpanded(new Set(collectExpandedIds(data.tree)));

      if (selectedId) {
        const stillExists = findNodeById(data.tree, selectedId);
        if (!stillExists) {
          setSelectedId(null);
          setEditing(false);
          setShowAddChild(false);
        }
      }
    } catch (e) {
      setError(
        e instanceof Error ? toUserFriendlyError(e.message) : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (selectedNode) {
      setEditForm(buildInitialForm(selectedNode));
    }
  }, [selectedNode]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveEdit() {
    if (!selectedNode) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/structure/item/${selectedNode.nodeType}/${selectedNode.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(getNodeEditPayload(selectedNode, editForm)),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(toUserFriendlyError(text || "Failed to update component."));
      }

      setEditing(false);
      await loadTree();
    } catch (e) {
      setError(
        e instanceof Error ? toUserFriendlyError(e.message) : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteNode() {
    if (!selectedNode) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/structure/item/${selectedNode.nodeType}/${selectedNode.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(toUserFriendlyError(text || "Failed to delete component."));
      }

      setShowDelete(false);
      setSelectedId(null);
      setEditing(false);
      setShowAddChild(false);
      await loadTree();
    } catch (e) {
      setShowDelete(false);
      setError(
        e instanceof Error
          ? toUserFriendlyError(e.message)
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const selectedChildren = selectedNode?.children ?? [];
  const allFlat = useMemo(() => flattenTree(tree), [tree]);

  return (
    <>
      <section className="border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium">Project structure</h2>

          <Link href={`/projects/${projectId}/create-component`}>
            <button className="border px-3 py-2 rounded">Create component</button>
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
          <div className="border rounded-xl p-3 min-h-[100px]">
            {loading ? (
              <p className="text-sm opacity-70">Loading structure...</p>
            ) : tree.length === 0 ? (
              <p className="text-sm opacity-70">No components in this project yet.</p>
            ) : (
              <ul className="space-y-2">
                {tree.map((node) => (
                  <TreeItem
                    key={node.id}
                    node={node}
                    expanded={expanded}
                    selectedId={selectedId}
                    onToggle={toggleExpanded}
                    onSelect={(nodeValue) => {
                      if (!nodeValue.canRead) {
                        setSelectedId(null);
                        setEditing(false);
                        setShowAddChild(false);
                        setError("You can see this component in the tree, but you do not have permission to open its details.");
                        return;
                      }

                      setSelectedId(nodeValue.id);
                      setEditing(false);
                      setShowAddChild(false);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border rounded-xl p-4 min-h-[150px]">
            {!selectedNode ? (
              <div className="h-full flex items-center justify-center text-sm opacity-70">
                Select a component from the tree.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs opacity-60">
                      {typeLabel(selectedNode.nodeType)}
                    </div>
                    <h3 className="text-2xl font-semibold">{selectedNode.label}</h3>
                  </div>

                  <button
                    className="border rounded px-3 py-1"
                    onClick={() => {
                      setSelectedId(null);
                      setEditing(false);
                      setShowAddChild(false);
                    }}
                  >
                    Go back
                  </button>
                </div>

                <DetailFields
                  node={selectedNode}
                  editing={editing}
                  form={editForm}
                  setForm={setEditForm}
                />

                {selectedChildren.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Child components</h4>
                    <ul className="space-y-2">
                      {selectedChildren.map((child) => (
                        <li
                          key={child.id}
                          className="border rounded-lg p-3 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-medium">{child.label}</div>
                            <div className="text-xs opacity-60">
                              {typeLabel(child.nodeType)}
                            </div>
                          </div>

                          <button
                            className="border rounded px-3 py-1"
                            onClick={() => {
                              const found =
                                allFlat.find((item) => item.id === child.id) ?? child;

                              if (!found.canRead) {
                                setSelectedId(null);
                                setEditing(false);
                                setShowAddChild(false);
                                setError("You can see this component in the tree, but you do not have permission to open its details.");
                                return;
                              }

                              setSelectedId(found.id);
                              setEditing(false);
                              setShowAddChild(false);
                            }}
                          >
                            Open
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {!editing ? (
                    <button
                      className="border rounded px-3 py-2"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        className="border rounded px-3 py-2"
                        onClick={() => void saveEdit()}
                        disabled={busy}
                      >
                        {busy ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="border rounded px-3 py-2"
                        onClick={() => {
                          setEditing(false);
                          setEditForm(buildInitialForm(selectedNode));
                        }}
                      >
                        Cancel edit
                      </button>
                    </>
                  )}

                  <button
                    className="border rounded px-3 py-2"
                    onClick={() => setShowDelete(true)}
                  >
                    Delete
                  </button>

                  {allowedChildTypes(selectedNode.nodeType).length > 0 && (
                    <button
                      className="border rounded px-3 py-2"
                      onClick={() => setShowAddChild((prev) => !prev)}
                    >
                      {selectedNode.nodeType === "CONTROL"
                        ? "Add test step"
                        : "Add child component"}
                    </button>
                  )}
                </div>

                {showAddChild && (
                  <CreateChildForm
                    projectId={projectId}
                    parent={selectedNode}
                    onCancel={() => setShowAddChild(false)}
                    onSuccess={async () => {
                      setShowAddChild(false);
                      await loadTree();
                    }}
                    onError={(message) => setError(message)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {error && <ErrorModal message={error} onClose={() => setError(null)} />}

      {showDelete && selectedNode && (
        <DeleteModal
          node={selectedNode}
          loading={busy}
          onCancel={() => setShowDelete(false)}
          onConfirm={() => void deleteNode()}
        />
      )}
    </>
  );
}