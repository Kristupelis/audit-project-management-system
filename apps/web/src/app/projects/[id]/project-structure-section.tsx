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
      return {
        name: form.name ?? "",
        code: form.code?.trim() || undefined,
        description: form.description?.trim() || undefined,
        objective: form.objective?.trim() || undefined,
        scope: form.scope?.trim() || undefined,
        riskLevel: form.riskLevel || undefined,
        residualRisk: form.residualRisk || undefined,
        status: form.status || undefined,
        areaOwner: form.areaOwner?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };

    case "PROCESS":
      return {
        name: form.name ?? "",
        code: form.code?.trim() || undefined,
        description: form.description?.trim() || undefined,
        objective: form.objective?.trim() || undefined,
        processOwner: form.processOwner?.trim() || undefined,
        frequency: form.frequency || undefined,
        riskLevel: form.riskLevel || undefined,
        status: form.status || undefined,
        systemsInvolved: form.systemsInvolved?.trim() || undefined,
        keyInputs: form.keyInputs?.trim() || undefined,
        keyOutputs: form.keyOutputs?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };

    case "CONTROL":
      return {
        name: form.name ?? "",
        code: form.code?.trim() || undefined,
        description: form.description?.trim() || undefined,
        controlObjective: form.controlObjective?.trim() || undefined,
        controlType: form.controlType || undefined,
        controlNature: form.controlNature || undefined,
        controlOwner: form.controlOwner?.trim() || undefined,
        frequency: form.frequency || undefined,
        keyControl: form.keyControl === "true",
        relatedRisk: form.relatedRisk?.trim() || undefined,
        expectedEvidence: form.expectedEvidence?.trim() || undefined,
        testingStrategy: form.testingStrategy || undefined,
        status: form.status || undefined,
        notes: form.notes?.trim() || undefined,
      };

    case "TEST_STEP":
      return {
        description: form.description ?? "",
        stepNo: form.stepNo?.trim() ? Number(form.stepNo) : undefined,
        expectedResult: form.expectedResult?.trim() || undefined,
        actualResult: form.actualResult?.trim() || undefined,
        testMethod: form.testMethod || undefined,
        status: form.status || undefined,
        sampleReference: form.sampleReference?.trim() || undefined,
        performedBy: form.performedBy?.trim() || undefined,
        performedAt: form.performedAt || undefined,
        reviewedBy: form.reviewedBy?.trim() || undefined,
        reviewedAt: form.reviewedAt || undefined,
        notes: form.notes?.trim() || undefined,
      };

    case "FINDING":
      return {
        title: form.title ?? "",
        code: form.code?.trim() || undefined,
        description: form.description ?? "",
        criteria: form.criteria?.trim() || undefined,
        condition: form.condition?.trim() || undefined,
        cause: form.cause?.trim() || undefined,
        effect: form.effect?.trim() || undefined,
        recommendation: form.recommendation?.trim() || undefined,
        managementResponse: form.managementResponse?.trim() || undefined,
        actionOwner: form.actionOwner?.trim() || undefined,
        dueDate: form.dueDate || undefined,
        severity: form.severity ?? "",
        status: form.status || undefined,
        identifiedAt: form.identifiedAt || undefined,
        closedAt: form.closedAt || undefined,
        notes: form.notes?.trim() || undefined,
      };

    case "EVIDENCE":
      return {
        title: form.title ?? "",
        description: form.description?.trim() || undefined,
        type: form.type ?? "",
        source: form.source?.trim() || undefined,
        referenceNo: form.referenceNo?.trim() || undefined,
        externalUrl: form.externalUrl?.trim() || undefined,
        collectedBy: form.collectedBy?.trim() || undefined,
        collectedAt: form.collectedAt || undefined,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        reliabilityLevel: form.reliabilityLevel || undefined,
        confidentiality: form.confidentiality || undefined,
        status: form.status || undefined,
        version: form.version?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };
  }
}

function buildInitialForm(node: TreeNode): Record<string, string> {
  if (!node.data) return {};

  switch (node.nodeType) {
    case "AUDIT_AREA":
      return {
        name: node.data.name ?? "",
        code: node.data.code ?? "",
        description: node.data.description ?? "",
        objective: node.data.objective ?? "",
        scope: node.data.scope ?? "",
        riskLevel: node.data.riskLevel ?? "",
        residualRisk: node.data.residualRisk ?? "",
        status: node.data.status ?? "",
        areaOwner: node.data.areaOwner ?? "",
        notes: node.data.notes ?? "",
      };

    case "PROCESS":
      return {
        name: node.data.name ?? "",
        code: node.data.code ?? "",
        description: node.data.description ?? "",
        objective: node.data.objective ?? "",
        processOwner: node.data.processOwner ?? "",
        frequency: node.data.frequency ?? "",
        riskLevel: node.data.riskLevel ?? "",
        status: node.data.status ?? "",
        systemsInvolved: node.data.systemsInvolved ?? "",
        keyInputs: node.data.keyInputs ?? "",
        keyOutputs: node.data.keyOutputs ?? "",
        notes: node.data.notes ?? "",
      };

    case "CONTROL":
      return {
        name: node.data.name ?? "",
        code: node.data.code ?? "",
        description: node.data.description ?? "",
        controlObjective: node.data.controlObjective ?? "",
        controlType: node.data.controlType ?? "",
        controlNature: node.data.controlNature ?? "",
        controlOwner: node.data.controlOwner ?? "",
        frequency: node.data.frequency ?? "",
        keyControl: String(node.data.keyControl ?? false),
        relatedRisk: node.data.relatedRisk ?? "",
        expectedEvidence: node.data.expectedEvidence ?? "",
        testingStrategy: node.data.testingStrategy ?? "",
        status: node.data.status ?? "",
        notes: node.data.notes ?? "",
      };

    case "TEST_STEP":
      return {
        description: node.data.description ?? "",
        stepNo: node.data.stepNo?.toString() ?? "",
        expectedResult: node.data.expectedResult ?? "",
        actualResult: node.data.actualResult ?? "",
        testMethod: node.data.testMethod ?? "",
        status: node.data.status ?? "",
        sampleReference: node.data.sampleReference ?? "",
        performedBy: node.data.performedBy ?? "",
        performedAt: node.data.performedAt?.slice(0, 10) ?? "",
        reviewedBy: node.data.reviewedBy ?? "",
        reviewedAt: node.data.reviewedAt?.slice(0, 10) ?? "",
        notes: node.data.notes ?? "",
      };

    case "FINDING":
      return {
        title: node.data.title ?? "",
        code: node.data.code ?? "",
        description: node.data.description ?? "",
        criteria: node.data.criteria ?? "",
        condition: node.data.condition ?? "",
        cause: node.data.cause ?? "",
        effect: node.data.effect ?? "",
        recommendation: node.data.recommendation ?? "",
        managementResponse: node.data.managementResponse ?? "",
        actionOwner: node.data.actionOwner ?? "",
        dueDate: node.data.dueDate?.slice(0, 10) ?? "",
        severity: node.data.severity ?? "",
        status: node.data.status ?? "",
        identifiedAt: node.data.identifiedAt?.slice(0, 10) ?? "",
        closedAt: node.data.closedAt?.slice(0, 10) ?? "",
        notes: node.data.notes ?? "",
      };

    case "EVIDENCE":
      return {
        title: node.data.title ?? "",
        description: node.data.description ?? "",
        type: node.data.type ?? "",
        source: node.data.source ?? "",
        referenceNo: node.data.referenceNo ?? "",
        externalUrl: node.data.externalUrl ?? "",
        collectedBy: node.data.collectedBy ?? "",
        collectedAt: node.data.collectedAt?.slice(0, 10) ?? "",
        validFrom: node.data.validFrom?.slice(0, 10) ?? "",
        validTo: node.data.validTo?.slice(0, 10) ?? "",
        reliabilityLevel: node.data.reliabilityLevel ?? "",
        confidentiality: node.data.confidentiality ?? "",
        status: node.data.status ?? "",
        version: node.data.version ?? "",
        notes: node.data.notes ?? "",
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

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
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
        {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
      </div>
    </div>
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
  if (!node.data) return null;

  if (editing) {
    switch (node.nodeType) {
      case "AUDIT_AREA":
        return (
          <div className="space-y-3">
            {[
              ["Name", "name"],
              ["Code", "code"],
              ["Description", "description"],
              ["Objective", "objective"],
              ["Scope", "scope"],
              ["Area owner", "areaOwner"],
              ["Notes", "notes"],
            ].map(([label, key]) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium">{label}</label>
                {["description", "objective", "scope", "notes"].includes(key) ? (
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Risk level</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.riskLevel ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, riskLevel: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Residual risk</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.residualRisk ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, residualRisk: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Status</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.status ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case "PROCESS":
        return (
          <div className="space-y-3">
            {[
              ["Name", "name"],
              ["Code", "code"],
              ["Description", "description"],
              ["Objective", "objective"],
              ["Process owner", "processOwner"],
              ["Systems involved", "systemsInvolved"],
              ["Key inputs", "keyInputs"],
              ["Key outputs", "keyOutputs"],
              ["Notes", "notes"],
            ].map(([label, key]) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium">{label}</label>
                {["description", "objective", "systemsInvolved", "keyInputs", "keyOutputs", "notes"].includes(key) ? (
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Frequency</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.frequency ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, frequency: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Risk level</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.riskLevel ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, riskLevel: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Status</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.status ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case "CONTROL":
        return (
          <div className="space-y-3">
            {[
              ["Name", "name"],
              ["Code", "code"],
              ["Description", "description"],
              ["Control objective", "controlObjective"],
              ["Control owner", "controlOwner"],
              ["Related risk", "relatedRisk"],
              ["Expected evidence", "expectedEvidence"],
              ["Notes", "notes"],
            ].map(([label, key]) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium">{label}</label>
                {["description", "controlObjective", "relatedRisk", "expectedEvidence", "notes"].includes(key) ? (
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}

            <div className="grid gap-3 md:grid-cols-3">
              {["controlType", "controlNature", "frequency", "testingStrategy", "status"].map((key) => (
                <div key={key} className="space-y-1">
                  <label className="block text-sm font-medium">{key}</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="block text-sm font-medium">Key control</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.keyControl ?? "false"}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, keyControl: e.target.value }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "TEST_STEP":
        return (
          <div className="space-y-3">
            {[
              ["Description", "description"],
              ["Expected result", "expectedResult"],
              ["Actual result", "actualResult"],
              ["Sample reference", "sampleReference"],
              ["Performed by", "performedBy"],
              ["Reviewed by", "reviewedBy"],
              ["Notes", "notes"],
            ].map(([label, key]) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium">{label}</label>
                {["description", "expectedResult", "actualResult", "notes"].includes(key) ? (
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}

            <div className="grid gap-3 md:grid-cols-3">
              {["stepNo", "testMethod", "status"].map((key) => (
                <div key={key} className="space-y-1">
                  <label className="block text-sm font-medium">{key}</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="block text-sm font-medium">Performed at</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.performedAt ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, performedAt: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Reviewed at</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.reviewedAt ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, reviewedAt: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case "FINDING":
        return (
          <div className="space-y-3">
            {[
              ["Title", "title"],
              ["Code", "code"],
              ["Description", "description"],
              ["Criteria", "criteria"],
              ["Condition", "condition"],
              ["Cause", "cause"],
              ["Effect", "effect"],
              ["Recommendation", "recommendation"],
              ["Management response", "managementResponse"],
              ["Action owner", "actionOwner"],
              ["Severity", "severity"],
              ["Notes", "notes"],
            ].map(([label, key]) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium">{label}</label>
                {["description", "criteria", "condition", "cause", "effect", "recommendation", "managementResponse", "notes"].includes(key) ? (
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Status</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.status ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Due date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.dueDate ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Identified at</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.identifiedAt ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, identifiedAt: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Closed at</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.closedAt ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, closedAt: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case "EVIDENCE":
        return (
          <div className="space-y-3">
            {[
              ["Title", "title"],
              ["Description", "description"],
              ["Type", "type"],
              ["Source", "source"],
              ["Reference number", "referenceNo"],
              ["External URL", "externalUrl"],
              ["Collected by", "collectedBy"],
              ["Version", "version"],
              ["Notes", "notes"],
            ].map(([label, key]) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium">{label}</label>
                {["description", "notes"].includes(key) ? (
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}

            <div className="grid gap-3 md:grid-cols-3">
              {["reliabilityLevel", "confidentiality", "status"].map((key) => (
                <div key={key} className="space-y-1">
                  <label className="block text-sm font-medium">{key}</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="block text-sm font-medium">Collected at</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.collectedAt ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, collectedAt: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Valid from</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.validFrom ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, validFrom: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Valid to</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.validTo ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, validTo: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        );
    }
  }

  switch (node.nodeType) {
    case "AUDIT_AREA":
      return (
        <div className="space-y-2">
          <Field label="Name" value={node.data.name} />
          <Field label="Code" value={node.data.code} />
          <Field label="Description" value={node.data.description} />
          <Field label="Objective" value={node.data.objective} />
          <Field label="Scope" value={node.data.scope} />
          <Field label="Risk level" value={node.data.riskLevel} />
          <Field label="Residual risk" value={node.data.residualRisk} />
          <Field label="Status" value={node.data.status} />
          <Field label="Area owner" value={node.data.areaOwner} />
          <Field label="Notes" value={node.data.notes} />
        </div>
      );

    case "PROCESS":
      return (
        <div className="space-y-2">
          <Field label="Name" value={node.data.name} />
          <Field label="Code" value={node.data.code} />
          <Field label="Description" value={node.data.description} />
          <Field label="Objective" value={node.data.objective} />
          <Field label="Process owner" value={node.data.processOwner} />
          <Field label="Frequency" value={node.data.frequency} />
          <Field label="Risk level" value={node.data.riskLevel} />
          <Field label="Status" value={node.data.status} />
          <Field label="Systems involved" value={node.data.systemsInvolved} />
          <Field label="Key inputs" value={node.data.keyInputs} />
          <Field label="Key outputs" value={node.data.keyOutputs} />
          <Field label="Notes" value={node.data.notes} />
        </div>
      );

    case "CONTROL":
      return (
        <div className="space-y-2">
          <Field label="Name" value={node.data.name} />
          <Field label="Code" value={node.data.code} />
          <Field label="Description" value={node.data.description} />
          <Field label="Control objective" value={node.data.controlObjective} />
          <Field label="Control type" value={node.data.controlType} />
          <Field label="Control nature" value={node.data.controlNature} />
          <Field label="Control owner" value={node.data.controlOwner} />
          <Field label="Frequency" value={node.data.frequency} />
          <Field label="Key control" value={node.data.keyControl} />
          <Field label="Related risk" value={node.data.relatedRisk} />
          <Field label="Expected evidence" value={node.data.expectedEvidence} />
          <Field label="Testing strategy" value={node.data.testingStrategy} />
          <Field label="Status" value={node.data.status} />
          <Field label="Notes" value={node.data.notes} />
        </div>
      );

    case "TEST_STEP":
      return (
        <div className="space-y-2">
          <Field label="Step no" value={node.data.stepNo} />
          <Field label="Description" value={node.data.description} />
          <Field label="Expected result" value={node.data.expectedResult} />
          <Field label="Actual result" value={node.data.actualResult} />
          <Field label="Test method" value={node.data.testMethod} />
          <Field label="Status" value={node.data.status} />
          <Field label="Sample reference" value={node.data.sampleReference} />
          <Field label="Performed by" value={node.data.performedBy} />
          <Field label="Performed at" value={node.data.performedAt?.slice(0, 10)} />
          <Field label="Reviewed by" value={node.data.reviewedBy} />
          <Field label="Reviewed at" value={node.data.reviewedAt?.slice(0, 10)} />
          <Field label="Notes" value={node.data.notes} />
        </div>
      );

    case "FINDING":
      return (
        <div className="space-y-2">
          <Field label="Title" value={node.data.title} />
          <Field label="Code" value={node.data.code} />
          <Field label="Description" value={node.data.description} />
          <Field label="Criteria" value={node.data.criteria} />
          <Field label="Condition" value={node.data.condition} />
          <Field label="Cause" value={node.data.cause} />
          <Field label="Effect" value={node.data.effect} />
          <Field label="Recommendation" value={node.data.recommendation} />
          <Field label="Management response" value={node.data.managementResponse} />
          <Field label="Action owner" value={node.data.actionOwner} />
          <Field label="Due date" value={node.data.dueDate?.slice(0, 10)} />
          <Field label="Severity" value={node.data.severity} />
          <Field label="Status" value={node.data.status} />
          <Field label="Identified at" value={node.data.identifiedAt?.slice(0, 10)} />
          <Field label="Closed at" value={node.data.closedAt?.slice(0, 10)} />
          <Field label="Notes" value={node.data.notes} />
        </div>
      );

    case "EVIDENCE":
      return (
        <div className="space-y-2">
          <Field label="Title" value={node.data.title} />
          <Field label="Description" value={node.data.description} />
          <Field label="Type" value={node.data.type} />
          <Field label="Source" value={node.data.source} />
          <Field label="Reference number" value={node.data.referenceNo} />
          <Field label="External URL" value={node.data.externalUrl} />
          <Field label="Collected by" value={node.data.collectedBy} />
          <Field label="Collected at" value={node.data.collectedAt?.slice(0, 10)} />
          <Field label="Valid from" value={node.data.validFrom?.slice(0, 10)} />
          <Field label="Valid to" value={node.data.validTo?.slice(0, 10)} />
          <Field label="Reliability level" value={node.data.reliabilityLevel} />
          <Field label="Confidentiality" value={node.data.confidentiality} />
          <Field label="Status" value={node.data.status} />
          <Field label="Version" value={node.data.version} />
          <Field label="Notes" value={node.data.notes} />
        </div>
      );
  }
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
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    onError(
      "For now, use the full 'Create component' page to create new child components, because it has the richer audit-specific form fields."
    );
    setSubmitting(false);
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

      <p className="text-sm opacity-70">
        Rich create forms are now handled in the dedicated create page.
      </p>

      <div className="flex gap-2">
        <Link href={`/projects/${projectId}/create-component`}>
          <button type="button" className="border rounded px-3 py-2">
            Open create page
          </button>
        </Link>
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
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
        throw new Error(toUserFriendlyError(text || "Failed to load structure."));
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
                  <div className="border rounded-xl p-4 space-y-3">
                    <h4 className="font-medium">Add child component</h4>
                    <p className="text-sm opacity-70">
                      Continue in the dedicated create page with the child type and parent preselected.
                    </p>

                    <div className="flex gap-2">
                      <Link
                        href={`/projects/${projectId}/create-component?nodeType=${
                          allowedChildTypes(selectedNode.nodeType)[0]
                        }&parentId=${selectedNode.id}`}
                      >
                        <button type="button" className="border rounded px-3 py-2">
                          Open create page
                        </button>
                      </Link>

                      <button
                        type="button"
                        className="border rounded px-3 py-2"
                        onClick={() => setShowAddChild(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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