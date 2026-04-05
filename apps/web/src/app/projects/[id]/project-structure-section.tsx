"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toUserFriendlyError } from "@/lib/error-message";
import { useLanguage } from "@/providers/language-provider";
import { useT } from "@/i18n/use-t";

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
  code?: string | null;
  description?: string | null;
  objective?: string | null;
  scope?: string | null;
  riskLevel?: string | null;
  residualRisk?: string | null;
  status: string;
  areaOwner?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type ProcessData = {
  id: string;
  auditAreaId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  objective?: string | null;
  processOwner?: string | null;
  frequency?: string | null;
  riskLevel?: string | null;
  status: string;
  systemsInvolved?: string | null;
  keyInputs?: string | null;
  keyOutputs?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type ControlData = {
  id: string;
  processId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  controlObjective?: string | null;
  controlType?: string | null;
  controlNature?: string | null;
  controlOwner?: string | null;
  frequency?: string | null;
  keyControl: boolean;
  relatedRisk?: string | null;
  expectedEvidence?: string | null;
  testingStrategy?: string | null;
  status: string;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type TestStepData = {
  id: string;
  controlId: string;
  stepNo?: number | null;
  description: string;
  expectedResult?: string | null;
  actualResult?: string | null;
  testMethod?: string | null;
  status: string;
  sampleReference?: string | null;
  performedBy?: string | null;
  performedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type FindingData = {
  id: string;
  processId: string;
  title: string;
  code?: string | null;
  description: string;
  criteria?: string | null;
  condition?: string | null;
  cause?: string | null;
  effect?: string | null;
  recommendation?: string | null;
  managementResponse?: string | null;
  actionOwner?: string | null;
  dueDate?: string | null;
  severity: string;
  status: string;
  identifiedAt?: string | null;
  closedAt?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type EvidenceData = {
  id: string;
  processId: string;
  title: string;
  description?: string | null;
  type: string;
  source?: string | null;
  referenceNo?: string | null;
  externalUrl?: string | null;
  collectedBy?: string | null;
  collectedAt?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  reliabilityLevel?: string | null;
  confidentiality?: string | null;
  status: string;
  version?: string | null;
  notes?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
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

function Field({
  label,
  value,
  yesLabel,
  noLabel,
}: {
  label: string;
  value?: string | number | boolean | null;
  yesLabel: string;
  noLabel: string;
}) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "false"
  ) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-sm opacity-80 whitespace-pre-wrap break-words">
        {typeof value === "boolean" ? (value ? yesLabel : noLabel) : String(value)}
      </div>
    </div>
  );
}

function ErrorModal({
  message,
  onClose,
  title,
  closeLabel,
}: {
  message: string;
  onClose: () => void;
  title: string;
  closeLabel: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-red-700">{title}</h3>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{message}</p>
          </div>

          <button
            className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
            onClick={onClose}
            type="button"
          >
            {closeLabel}
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
  title,
  message,
  warning,
  cancelLabel,
  deleteLabel,
  deletingLabel,
}: {
  node: TreeNode;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  title: string;
  message: string;
  warning: string;
  cancelLabel: string;
  deleteLabel: string;
  deletingLabel: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-red-700">{title}</h3>

            <p className="text-sm text-red-700 whitespace-pre-wrap">
              {message} <strong>{node.label}</strong>?
            </p>

            <p className="text-sm text-red-700 whitespace-pre-wrap">{warning}</p>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
              onClick={onCancel}
              disabled={loading}
              type="button"
            >
              {cancelLabel}
            </button>

            <button
              className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
              onClick={onConfirm}
              disabled={loading}
              type="button"
            >
              {loading ? deletingLabel : deleteLabel}
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
  typeLabel,
}: {
  node: TreeNode;
  expanded: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
  typeLabel: (type: NodeType) => string;
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
          <span className="ml-2 text-xs opacity-60">{typeLabel(node.nodeType)}</span>
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
              typeLabel={typeLabel}
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
  onCancel,
  typeLabel,
  title,
  componentTypeLabel,
  richFormsMessage,
  openCreatePageLabel,
  cancelLabel,
}: {
  projectId: string;
  parent: TreeNode;
  onCancel: () => void;
  typeLabel: (type: NodeType) => string;
  title: string;
  componentTypeLabel: string;
  richFormsMessage: string;
  openCreatePageLabel: string;
  cancelLabel: string;
}) {
  const childTypes = allowedChildTypes(parent.nodeType);
  const [nodeType, setNodeType] = useState<NodeType>(childTypes[0]);

  return (
    <form className="border rounded-xl p-4 space-y-3">
      <h4 className="font-medium">{title}</h4>

      <div className="space-y-1">
        <label className="block text-sm">{componentTypeLabel}</label>
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

      <p className="text-sm opacity-70">{richFormsMessage}</p>

      <div className="flex gap-2">
        <Link
          href={`/projects/${projectId}/create-component?nodeType=${nodeType}&parentId=${parent.id}`}
        >
          <button type="button" className="border rounded px-3 py-2">
            {openCreatePageLabel}
          </button>
        </Link>
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      </div>
    </form>
  );
}

export default function ProjectStructureSection({
  projectId,
}: {
  projectId: string;
}) {
  const t = useT();
  const { locale } = useLanguage();

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => (selectedId ? findNodeById(tree, selectedId) : null),
    [tree, selectedId],
  );

  const typeLabel = (type: NodeType) => {
    switch (type) {
      case "AUDIT_AREA":
        return t.structure.auditArea;
      case "PROCESS":
        return t.structure.process;
      case "CONTROL":
        return t.structure.control;
      case "TEST_STEP":
        return t.structure.testStep;
      case "FINDING":
        return t.structure.finding;
      case "EVIDENCE":
        return t.structure.evidence;
    }
  };

  const statusLabel = (value?: string | null) => {
    if (!value) return value;
    return t.enums.projectStatus[
      value as keyof typeof t.enums.projectStatus
    ] ?? value;
  };

  const riskLabel = (value?: string | null) => {
    if (!value) return value;
    return t.structure.riskLevelValues?.[
      value as keyof typeof t.structure.riskLevelValues
    ] ?? value;
  };

  const severityLabel = (value?: string | null) => {
    if (!value) return value;
    return t.structure.severityValues?.[
      value as keyof typeof t.structure.severityValues
    ] ?? value;
  };

  const yesNo = (value?: boolean | null) => (value ? t.structure.yes : t.structure.no);

  async function loadTree() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/structure`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          toUserFriendlyError(text || "Failed to load structure.", locale),
        );
      }

      const data = (await res.json()) as StructureResponse;
      setTree(data.tree);
      setExpanded(new Set(collectExpandedIds(data.tree)));

      if (selectedId) {
        const stillExists = findNodeById(data.tree, selectedId);
        if (!stillExists) {
          setSelectedId(null);
          setShowAddChild(false);
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : locale === "lt"
            ? "Įvyko klaida. Bandykite dar kartą."
            : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteNode() {
    if (!selectedNode) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/structure/item/${selectedNode.nodeType}/${selectedNode.id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          toUserFriendlyError(text || "Failed to delete component.", locale),
        );
      }

      setShowDelete(false);
      setSelectedId(null);
      setShowAddChild(false);
      await loadTree();
    } catch (e) {
      setShowDelete(false);
      setError(
        e instanceof Error
          ? e.message
          : locale === "lt"
            ? "Įvyko klaida. Bandykite dar kartą."
            : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const selectedChildren = selectedNode?.children ?? [];
  const allFlat = useMemo(() => flattenTree(tree), [tree]);

  const renderReadFields = (node: TreeNode) => {
    if (!node.data) return null;

    switch (node.nodeType) {
      case "AUDIT_AREA":
        return (
          <div className="space-y-2">
            <Field label={t.structure.name} value={node.data.name} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.code} value={node.data.code} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.description} value={node.data.description} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.objective} value={node.data.objective} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.scope} value={node.data.scope} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.riskLevel} value={riskLabel(node.data.riskLevel)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.residualRisk} value={riskLabel(node.data.residualRisk)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.status} value={statusLabel(node.data.status)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.areaOwner} value={node.data.areaOwner} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.notes} value={node.data.notes} yesLabel={t.structure.yes} noLabel={t.structure.no} />
          </div>
        );

      case "PROCESS":
        return (
          <div className="space-y-2">
            <Field label={t.structure.name} value={node.data.name} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.code} value={node.data.code} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.description} value={node.data.description} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.objective} value={node.data.objective} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.processOwner} value={node.data.processOwner} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.frequency} value={node.data.frequency} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.riskLevel} value={riskLabel(node.data.riskLevel)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.status} value={statusLabel(node.data.status)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.systemsInvolved} value={node.data.systemsInvolved} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.keyInputs} value={node.data.keyInputs} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.keyOutputs} value={node.data.keyOutputs} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.notes} value={node.data.notes} yesLabel={t.structure.yes} noLabel={t.structure.no} />
          </div>
        );

      case "CONTROL":
        return (
          <div className="space-y-2">
            <Field label={t.structure.name} value={node.data.name} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.code} value={node.data.code} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.description} value={node.data.description} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.controlObjective} value={node.data.controlObjective} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.controlType} value={node.data.controlType} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.controlNature} value={node.data.controlNature} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.controlOwner} value={node.data.controlOwner} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.frequency} value={node.data.frequency} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.keyControl} value={yesNo(node.data.keyControl)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.relatedRisk} value={node.data.relatedRisk} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.expectedEvidence} value={node.data.expectedEvidence} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.testingStrategy} value={node.data.testingStrategy} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.status} value={statusLabel(node.data.status)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.notes} value={node.data.notes} yesLabel={t.structure.yes} noLabel={t.structure.no} />
          </div>
        );

      case "TEST_STEP":
        return (
          <div className="space-y-2">
            <Field label={t.structure.stepNo} value={node.data.stepNo} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.description} value={node.data.description} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.expectedResult} value={node.data.expectedResult} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.actualResult} value={node.data.actualResult} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.testMethod} value={node.data.testMethod} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.status} value={statusLabel(node.data.status)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.sampleReference} value={node.data.sampleReference} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.performedBy} value={node.data.performedBy} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.performedAt} value={node.data.performedAt?.slice(0, 10)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.reviewedBy} value={node.data.reviewedBy} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.reviewedAt} value={node.data.reviewedAt?.slice(0, 10)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.notes} value={node.data.notes} yesLabel={t.structure.yes} noLabel={t.structure.no} />
          </div>
        );

      case "FINDING":
        return (
          <div className="space-y-2">
            <Field label={t.structure.title} value={node.data.title} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.code} value={node.data.code} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.description} value={node.data.description} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.criteria} value={node.data.criteria} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.condition} value={node.data.condition} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.cause} value={node.data.cause} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.effect} value={node.data.effect} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.recommendation} value={node.data.recommendation} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.managementResponse} value={node.data.managementResponse} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.actionOwner} value={node.data.actionOwner} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.dueDate} value={node.data.dueDate?.slice(0, 10)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.severity} value={severityLabel(node.data.severity)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.status} value={statusLabel(node.data.status)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.identifiedAt} value={node.data.identifiedAt?.slice(0, 10)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.closedAt} value={node.data.closedAt?.slice(0, 10)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.notes} value={node.data.notes} yesLabel={t.structure.yes} noLabel={t.structure.no} />
          </div>
        );

      case "EVIDENCE":
        return (
          <div className="space-y-2">
            <Field label={t.structure.title} value={node.data.title} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.description} value={node.data.description} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.type} value={node.data.type} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.source} value={node.data.source} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.referenceNo} value={node.data.referenceNo} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.externalUrl} value={node.data.externalUrl} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.collectedBy} value={node.data.collectedBy} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.collectedAt} value={node.data.collectedAt?.slice(0, 10)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.validFrom} value={node.data.validFrom?.slice(0, 10)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.validTo} value={node.data.validTo?.slice(0, 10)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.reliabilityLevel} value={node.data.reliabilityLevel} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.confidentiality} value={node.data.confidentiality} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.status} value={statusLabel(node.data.status)} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.version} value={node.data.version} yesLabel={t.structure.yes} noLabel={t.structure.no} />
            <Field label={t.structure.notes} value={node.data.notes} yesLabel={t.structure.yes} noLabel={t.structure.no} />
          </div>
        );
    }
  };

  return (
    <>
      <section className="border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium">{t.structure.projectStructure}</h2>

          <Link href={`/projects/${projectId}/create-component`}>
            <button className="border px-3 py-2 rounded">
              {t.structure.createComponent}
            </button>
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
          <div className="border rounded-xl p-3 min-h-[100px]">
            {loading ? (
              <p className="text-sm opacity-70">{t.structure.loadingStructure}</p>
            ) : tree.length === 0 ? (
              <p className="text-sm opacity-70">{t.structure.noComponents}</p>
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
                        setShowAddChild(false);
                        setError(t.structure.noPermissionToOpenDetails);
                        return;
                      }

                      setSelectedId(nodeValue.id);
                      setShowAddChild(false);
                    }}
                    typeLabel={typeLabel}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border rounded-xl p-4 min-h-[150px]">
            {!selectedNode ? (
              <div className="h-full flex items-center justify-center text-sm opacity-70">
                {t.structure.selectComponent}
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
                      setShowAddChild(false);
                    }}
                    type="button"
                  >
                    {t.structure.goBack}
                  </button>
                </div>

                {renderReadFields(selectedNode)}

                {selectedChildren.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">{t.structure.childComponents}</h4>
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
                                setShowAddChild(false);
                                setError(t.structure.noPermissionToOpenDetails);
                                return;
                              }

                              setSelectedId(found.id);
                              setShowAddChild(false);
                            }}
                            type="button"
                          >
                            {t.structure.open}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/projects/${projectId}/create-component?mode=edit&nodeType=${selectedNode.nodeType}&itemId=${selectedNode.id}`}
                  >
                    <button
                      className="border rounded px-3 py-2"
                      type="button"
                    >
                      {t.common.edit}
                    </button>
                  </Link>

                  <button
                    className="border rounded px-3 py-2"
                    onClick={() => setShowDelete(true)}
                    type="button"
                  >
                    {t.common.delete}
                  </button>

                  {allowedChildTypes(selectedNode.nodeType).length > 0 && (
                    <button
                      className="border rounded px-3 py-2"
                      onClick={() => setShowAddChild((prev) => !prev)}
                      type="button"
                    >
                      {selectedNode.nodeType === "CONTROL"
                        ? t.structure.addTestStep
                        : t.structure.addChildComponent}
                    </button>
                  )}
                </div>

                {showAddChild && (
                  <CreateChildForm
                    projectId={projectId}
                    parent={selectedNode}
                    onCancel={() => setShowAddChild(false)}
                    typeLabel={typeLabel}
                    title={t.structure.addChildComponent}
                    componentTypeLabel={t.structure.componentType}
                    richFormsMessage={t.structure.richCreateFormsMoved}
                    openCreatePageLabel={t.structure.openCreatePage}
                    cancelLabel={t.common.cancel}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <ErrorModal
          message={error}
          onClose={() => setError(null)}
          title={t.common.error}
          closeLabel={t.common.close}
        />
      )}

      {showDelete && selectedNode && (
        <DeleteModal
          node={selectedNode}
          loading={busy}
          onCancel={() => setShowDelete(false)}
          onConfirm={() => void deleteNode()}
          title={t.projects.confirmDeleteTitle}
          message={t.structure.deleteNodeMessage}
          warning={t.structure.deleteNodeWarning}
          cancelLabel={t.common.cancel}
          deleteLabel={t.common.delete}
          deletingLabel={t.projects.deleting}
        />
      )}
    </>
  );
}