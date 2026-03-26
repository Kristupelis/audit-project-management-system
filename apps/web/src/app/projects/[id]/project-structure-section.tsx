"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NodeType =
  | "AUDIT_AREA"
  | "PROCESS"
  | "CONTROL"
  | "TEST_STEP"
  | "FINDING"
  | "EVIDENCE";

type StructureNode = {
  id: string;
  nodeType: NodeType;
  name: string;
  description: string | null;
  parentId: string | null;
  children: StructureNode[];
};

type StructureResponse = {
  tree: StructureNode[];
  flat: StructureNode[];
};

type ErrorModalProps = {
  message: string;
  onClose: () => void;
};

function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-4 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold">Error</h3>
        <p className="text-sm whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end">
          <button className="border rounded px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function typeLabel(type: NodeType): string {
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
      return ["CONTROL"];
    case "CONTROL":
      return ["TEST_STEP", "FINDING", "EVIDENCE"];
    default:
      return [];
  }
}

function recursiveIds(nodes: StructureNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    ids.push(...recursiveIds(node.children));
  }
  return ids;
}

type TreeNodeProps = {
  node: StructureNode;
  expanded: Set<string>;
  selectedId: string | null;
  toggleExpanded: (id: string) => void;
  selectNode: (node: StructureNode) => void;
};

function TreeNode({
  node,
  expanded,
  selectedId,
  toggleExpanded,
  selectNode,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <li className="space-y-1">
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
          isSelected ? "bg-gray-100 border" : ""
        }`}
      >
        <button
          type="button"
          className="w-6 text-center"
          onClick={() => hasChildren && toggleExpanded(node.id)}
        >
          {hasChildren ? (isExpanded ? "−" : "+") : "•"}
        </button>

        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => selectNode(node)}
        >
          <span className="font-medium">{node.name}</span>
          <span className="ml-2 text-xs opacity-60">{typeLabel(node.nodeType)}</span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="ml-5 space-y-1 border-l pl-3">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expanded={expanded}
              selectedId={selectedId}
              toggleExpanded={toggleExpanded}
              selectNode={selectNode}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

type CreateChildFormProps = {
  projectId: string;
  parent: StructureNode;
  onCancel: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
};

function CreateChildForm({
  projectId,
  parent,
  onCancel,
  onSuccess,
  onError,
}: CreateChildFormProps) {
  const childTypes = allowedChildTypes(parent.nodeType);
  const [nodeType, setNodeType] = useState<NodeType>(childTypes[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (childTypes.length === 0) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/structure/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeType,
          name,
          description: description || null,
          parentId: parent.id,
          parentType: parent.nodeType,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create child component.");
      }

      setName("");
      setDescription("");
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-3">
      <h3 className="font-medium">Add child component</h3>

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

      <div className="space-y-1">
        <label className="block text-sm">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm">Description</label>
        <textarea
          className="w-full border rounded px-3 py-2 min-h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="border rounded px-3 py-2"
          disabled={submitting}
        >
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

type DeleteConfirmProps = {
  node: StructureNode;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
};

function DeleteConfirm({ node, onCancel, onConfirm, loading }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-white p-4 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold">Confirm deletion</h3>
        <p className="text-sm">
          Are you sure you want to delete <strong>{node.name}</strong>?
        </p>
        <p className="text-sm text-red-600">
          All related child components of this item will also be deleted.
        </p>

        <div className="flex justify-end gap-2">
          <button className="border rounded px-3 py-1" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="border rounded px-3 py-1 bg-red-600 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectStructureSection({
  projectId,
}: {
  projectId: string;
}) {
  const [tree, setTree] = useState<StructureNode[]>([]);
  const [flat, setFlat] = useState<StructureNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StructureNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCreateChild, setShowCreateChild] = useState(false);

  async function loadStructure() {
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/structure`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load project structure.");
      }

      const data = (await res.json()) as StructureResponse;
      setTree(data.tree);
      setFlat(data.flat);

      const allIds = recursiveIds(data.tree);
      setExpanded(new Set(allIds));

      if (selected) {
        const updatedSelected = data.flat.find((item) => item.id === selected.id) ?? null;
        setSelected(updatedSelected);
        if (!updatedSelected) {
          setEditMode(false);
          setShowCreateChild(false);
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error while loading structure."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (selected) {
      setEditName(selected.name);
      setEditDescription(selected.description ?? "");
    }
  }, [selected]);

  const selectedChildren = useMemo(() => selected?.children ?? [], [selected]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSaveEdit() {
    if (!selected) return;

    setSavingEdit(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/structure/item/${selected.nodeType}/${selected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            description: editDescription || null,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update component.");
      }

      setEditMode(false);
      await loadStructure();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/structure/item/${selected.nodeType}/${selected.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete component.");
      }

      setShowDeleteConfirm(false);
      setSelected(null);
      setEditMode(false);
      setShowCreateChild(false);
      await loadStructure();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium">Project structure</h2>

          <Link href={`/projects/${projectId}/create-component`}>
            <button className="border rounded px-3 py-2">Create component</button>
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
          <div className="border rounded-xl p-3 min-h-[400px]">
            {loading ? (
              <p className="text-sm opacity-70">Loading structure...</p>
            ) : tree.length === 0 ? (
              <p className="text-sm opacity-70">No components in this project yet.</p>
            ) : (
              <ul className="space-y-2">
                {tree.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    expanded={expanded}
                    selectedId={selected?.id ?? null}
                    toggleExpanded={toggleExpanded}
                    selectNode={(item) => {
                      setSelected(item);
                      setEditMode(false);
                      setShowCreateChild(false);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border rounded-xl p-4 min-h-[400px]">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-sm opacity-70">
                Select a component from the tree to open it.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs opacity-60">{typeLabel(selected.nodeType)}</div>

                    {editMode ? (
                      <input
                        className="w-full border rounded px-3 py-2 text-xl font-semibold"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      <h3 className="text-2xl font-semibold">{selected.name}</h3>
                    )}
                  </div>

                  <button
                    className="border rounded px-3 py-1"
                    onClick={() => {
                      setSelected(null);
                      setEditMode(false);
                      setShowCreateChild(false);
                    }}
                  >
                    Go back
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">Description</div>
                  {editMode ? (
                    <textarea
                      className="w-full border rounded px-3 py-2 min-h-28"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm opacity-80">
                      {selected.description || "No description."}
                    </p>
                  )}
                </div>

                {selectedChildren.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Child components</div>
                    <ul className="space-y-2">
                      {selectedChildren.map((child) => (
                        <li
                          key={child.id}
                          className="border rounded-lg px-3 py-2 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-medium">{child.name}</div>
                            <div className="text-xs opacity-60">
                              {typeLabel(child.nodeType)}
                            </div>
                          </div>

                          <button
                            className="border rounded px-3 py-1"
                            onClick={() => {
                              setSelected(flat.find((item) => item.id === child.id) ?? child);
                              setEditMode(false);
                              setShowCreateChild(false);
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
                  {!editMode ? (
                    <button
                      className="border rounded px-3 py-2"
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        className="border rounded px-3 py-2"
                        onClick={() => void handleSaveEdit()}
                        disabled={savingEdit}
                      >
                        {savingEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="border rounded px-3 py-2"
                        onClick={() => {
                          setEditMode(false);
                          setEditName(selected.name);
                          setEditDescription(selected.description ?? "");
                        }}
                      >
                        Cancel edit
                      </button>
                    </>
                  )}

                  <button
                    className="border rounded px-3 py-2"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </button>

                  {allowedChildTypes(selected.nodeType).length > 0 && (
                    <button
                      className="border rounded px-3 py-2"
                      onClick={() => setShowCreateChild((prev) => !prev)}
                    >
                      Add child
                    </button>
                  )}
                </div>

                {showCreateChild && (
                  <CreateChildForm
                    projectId={projectId}
                    parent={selected}
                    onCancel={() => setShowCreateChild(false)}
                    onSuccess={async () => {
                      setShowCreateChild(false);
                      await loadStructure();
                    }}
                    onError={(message) => setErrorMessage(message)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {errorMessage && (
        <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {showDeleteConfirm && selected && (
        <DeleteConfirm
          node={selected}
          loading={deleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </>
  );
}