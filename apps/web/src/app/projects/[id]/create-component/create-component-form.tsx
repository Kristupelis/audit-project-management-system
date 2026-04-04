"use client";

import { useEffect, useMemo, useState } from "react";
import { toUserFriendlyError } from "@/lib/error-message";
import { useRouter, useSearchParams } from "next/navigation";

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

function textInput(
  label: string,
  value: string,
  onChange: (value: string) => void,
  required = false,
) {
  return (
    <div className="space-y-1">
      <label className="block text-sm">{label}</label>
      <input
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function textAreaInput(
  label: string,
  value: string,
  onChange: (value: string) => void,
  required = false,
) {
  return (
    <div className="space-y-1">
      <label className="block text-sm">{label}</label>
      <textarea
        className="w-full border rounded px-3 py-2 min-h-24"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function dateInput(
  label: string,
  value: string,
  onChange: (value: string) => void,
) {
  return (
    <div className="space-y-1">
      <label className="block text-sm">{label}</label>
      <input
        type="date"
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function selectInput(
  label: string,
  value: string,
  onChange: (value: string) => void,
  options: { value: string; label: string }[],
  required = false,
) {
  return (
    <div className="space-y-1">
      <label className="block text-sm">{label}</label>
      <select
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {!required && <option value="">Select</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const nodeStatusOptions = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
  { value: "NOT_APPLICABLE", label: "Not applicable" },
];

const riskLevelOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const frequencyOptions = [
  { value: "AD_HOC", label: "Ad hoc" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

const controlTypeOptions = [
  { value: "PREVENTIVE", label: "Preventive" },
  { value: "DETECTIVE", label: "Detective" },
  { value: "CORRECTIVE", label: "Corrective" },
];

const controlNatureOptions = [
  { value: "MANUAL", label: "Manual" },
  { value: "AUTOMATED", label: "Automated" },
  { value: "IT_DEPENDENT_MANUAL", label: "IT-dependent manual" },
];

const testMethodOptions = [
  { value: "INQUIRY", label: "Inquiry" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "OBSERVATION", label: "Observation" },
  { value: "REPERFORMANCE", label: "Reperformance" },
  { value: "WALKTHROUGH", label: "Walkthrough" },
  { value: "ANALYTICAL_PROCEDURE", label: "Analytical procedure" },
  { value: "MIXED", label: "Mixed" },
];

const testStepStatusOptions = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "NOT_APPLICABLE", label: "Not applicable" },
];

const findingStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "REJECTED", label: "Rejected" },
];

const evidenceStatusOptions = [
  { value: "REQUESTED", label: "Requested" },
  { value: "RECEIVED", label: "Received" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

const reliabilityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const confidentialityOptions = [
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Internal" },
  { value: "CONFIDENTIAL", label: "Confidential" },
  { value: "RESTRICTED", label: "Restricted" },
];

export default function CreateComponentForm({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const searchParams = useSearchParams();

  const initialNodeType =
  (searchParams.get("nodeType") as NodeType | null) ?? "AUDIT_AREA";
  const initialParentId = searchParams.get("parentId") ?? "";

  const [nodeType, setNodeType] = useState<NodeType>(initialNodeType);
  const [parentId, setParentId] = useState(initialParentId);
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

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
            toUserFriendlyError(text || "Failed to load project structure."),
          );
        }

        const data = (await res.json()) as StructureResponse;
        setTree(data.tree);
      } catch (e) {
        setError(
          e instanceof Error
            ? toUserFriendlyError(e.message)
            : "Something went wrong. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStructure();
  }, [projectId]);

  useEffect(() => {
    setParentId((prev) => {
      const queryParentId = searchParams.get("parentId") ?? "";
      const queryNodeType = searchParams.get("nodeType") as NodeType | null;

      if (queryParentId && queryNodeType === nodeType) {
        return queryParentId;
      }

      return "";
    });

    switch (nodeType) {
      case "AUDIT_AREA":
        setForm({
          name: "",
          code: "",
          description: "",
          objective: "",
          scope: "",
          riskLevel: "",
          residualRisk: "",
          status: "NOT_STARTED",
          areaOwner: "",
          notes: "",
        });
        break;

      case "PROCESS":
        setForm({
          name: "",
          code: "",
          description: "",
          objective: "",
          processOwner: "",
          frequency: "",
          riskLevel: "",
          status: "NOT_STARTED",
          systemsInvolved: "",
          keyInputs: "",
          keyOutputs: "",
          notes: "",
        });
        break;

      case "CONTROL":
        setForm({
          name: "",
          code: "",
          description: "",
          controlObjective: "",
          controlType: "",
          controlNature: "",
          controlOwner: "",
          frequency: "",
          keyControl: "false",
          relatedRisk: "",
          expectedEvidence: "",
          testingStrategy: "",
          status: "NOT_STARTED",
          notes: "",
        });
        break;

      case "TEST_STEP":
        setForm({
          description: "",
          stepNo: "",
          expectedResult: "",
          actualResult: "",
          testMethod: "",
          status: "NOT_STARTED",
          sampleReference: "",
          performedBy: "",
          performedAt: "",
          reviewedBy: "",
          reviewedAt: "",
          notes: "",
        });
        break;

      case "FINDING":
        setForm({
          title: "",
          code: "",
          description: "",
          criteria: "",
          condition: "",
          cause: "",
          effect: "",
          recommendation: "",
          managementResponse: "",
          actionOwner: "",
          dueDate: "",
          severity: "",
          status: "DRAFT",
          identifiedAt: "",
          closedAt: "",
          notes: "",
        });
        break;

      case "EVIDENCE":
        setForm({
          title: "",
          description: "",
          type: "",
          source: "",
          referenceNo: "",
          externalUrl: "",
          collectedBy: "",
          collectedAt: "",
          validFrom: "",
          validTo: "",
          reliabilityLevel: "",
          confidentiality: "INTERNAL",
          status: "REQUESTED",
          version: "",
          notes: "",
        });
        break;
    }
  }, [nodeType]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload =
        nodeType === "AUDIT_AREA"
          ? {
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
            }
          : nodeType === "PROCESS"
            ? {
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
              }
            : nodeType === "CONTROL"
              ? {
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
                }
              : nodeType === "TEST_STEP"
                ? {
                    description: form.description ?? "",
                    stepNo: form.stepNo?.trim()
                      ? Number(form.stepNo)
                      : undefined,
                    expectedResult: form.expectedResult?.trim() || undefined,
                    actualResult: form.actualResult?.trim() || undefined,
                    testMethod: form.testMethod || undefined,
                    status: form.status || undefined,
                    sampleReference:
                      form.sampleReference?.trim() || undefined,
                    performedBy: form.performedBy?.trim() || undefined,
                    performedAt: form.performedAt || undefined,
                    reviewedBy: form.reviewedBy?.trim() || undefined,
                    reviewedAt: form.reviewedAt || undefined,
                    notes: form.notes?.trim() || undefined,
                  }
                : nodeType === "FINDING"
                  ? {
                      title: form.title ?? "",
                      code: form.code?.trim() || undefined,
                      description: form.description ?? "",
                      criteria: form.criteria?.trim() || undefined,
                      condition: form.condition?.trim() || undefined,
                      cause: form.cause?.trim() || undefined,
                      effect: form.effect?.trim() || undefined,
                      recommendation:
                        form.recommendation?.trim() || undefined,
                      managementResponse:
                        form.managementResponse?.trim() || undefined,
                      actionOwner: form.actionOwner?.trim() || undefined,
                      dueDate: form.dueDate || undefined,
                      severity: form.severity ?? "",
                      status: form.status || undefined,
                      identifiedAt: form.identifiedAt || undefined,
                      closedAt: form.closedAt || undefined,
                      notes: form.notes?.trim() || undefined,
                    }
                  : {
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
                      reliabilityLevel:
                        form.reliabilityLevel || undefined,
                      confidentiality:
                        form.confidentiality || undefined,
                      status: form.status || undefined,
                      version: form.version?.trim() || undefined,
                      notes: form.notes?.trim() || undefined,
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
        throw new Error(
          toUserFriendlyError(text || "Failed to create component."),
        );
      }

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? toUserFriendlyError(e.message)
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border rounded-xl p-4 w-full space-y-4">
      {error && (
        <div className="border rounded p-3 text-sm bg-red-50 border-red-300 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {nodeType === "AUDIT_AREA" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput("Name", form.name ?? "", (v) => updateField("name", v), true)}
              {textInput("Code", form.code ?? "", (v) => updateField("code", v))}
            </div>

            {textAreaInput(
              "Description",
              form.description ?? "",
              (v) => updateField("description", v),
            )}
            {textAreaInput(
              "Objective",
              form.objective ?? "",
              (v) => updateField("objective", v),
            )}
            {textAreaInput("Scope", form.scope ?? "", (v) => updateField("scope", v))}

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(
                "Risk level",
                form.riskLevel ?? "",
                (v) => updateField("riskLevel", v),
                riskLevelOptions,
              )}
              {selectInput(
                "Residual risk",
                form.residualRisk ?? "",
                (v) => updateField("residualRisk", v),
                riskLevelOptions,
              )}
              {selectInput(
                "Status",
                form.status ?? "NOT_STARTED",
                (v) => updateField("status", v),
                nodeStatusOptions,
                true,
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {textInput(
                "Area owner",
                form.areaOwner ?? "",
                (v) => updateField("areaOwner", v),
              )}
              {textAreaInput("Notes", form.notes ?? "", (v) => updateField("notes", v))}
            </div>
          </section>
        )}

        {nodeType === "PROCESS" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput("Name", form.name ?? "", (v) => updateField("name", v), true)}
              {textInput("Code", form.code ?? "", (v) => updateField("code", v))}
            </div>

            {textAreaInput(
              "Description",
              form.description ?? "",
              (v) => updateField("description", v),
            )}
            {textAreaInput(
              "Objective",
              form.objective ?? "",
              (v) => updateField("objective", v),
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(
                "Process owner",
                form.processOwner ?? "",
                (v) => updateField("processOwner", v),
              )}
              {selectInput(
                "Frequency",
                form.frequency ?? "",
                (v) => updateField("frequency", v),
                frequencyOptions,
              )}
              {selectInput(
                "Risk level",
                form.riskLevel ?? "",
                (v) => updateField("riskLevel", v),
                riskLevelOptions,
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(
                "Status",
                form.status ?? "NOT_STARTED",
                (v) => updateField("status", v),
                nodeStatusOptions,
                true,
              )}
              {textInput(
                "Systems involved",
                form.systemsInvolved ?? "",
                (v) => updateField("systemsInvolved", v),
              )}
              {textInput(
                "Key inputs",
                form.keyInputs ?? "",
                (v) => updateField("keyInputs", v),
              )}
            </div>

            {textInput(
              "Key outputs",
              form.keyOutputs ?? "",
              (v) => updateField("keyOutputs", v),
            )}
            {textAreaInput("Notes", form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        {nodeType === "CONTROL" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput("Name", form.name ?? "", (v) => updateField("name", v), true)}
              {textInput("Code", form.code ?? "", (v) => updateField("code", v))}
            </div>

            {textAreaInput(
              "Description",
              form.description ?? "",
              (v) => updateField("description", v),
            )}
            {textAreaInput(
              "Control objective",
              form.controlObjective ?? "",
              (v) => updateField("controlObjective", v),
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(
                "Control type",
                form.controlType ?? "",
                (v) => updateField("controlType", v),
                controlTypeOptions,
              )}
              {selectInput(
                "Control nature",
                form.controlNature ?? "",
                (v) => updateField("controlNature", v),
                controlNatureOptions,
              )}
              {textInput(
                "Control owner",
                form.controlOwner ?? "",
                (v) => updateField("controlOwner", v),
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(
                "Frequency",
                form.frequency ?? "",
                (v) => updateField("frequency", v),
                frequencyOptions,
              )}
              {selectInput(
                "Testing strategy",
                form.testingStrategy ?? "",
                (v) => updateField("testingStrategy", v),
                testMethodOptions,
              )}
              {selectInput(
                "Status",
                form.status ?? "NOT_STARTED",
                (v) => updateField("status", v),
                nodeStatusOptions,
                true,
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {textInput(
                "Related risk",
                form.relatedRisk ?? "",
                (v) => updateField("relatedRisk", v),
              )}
              {textInput(
                "Expected evidence",
                form.expectedEvidence ?? "",
                (v) => updateField("expectedEvidence", v),
              )}
            </div>

            {selectInput(
              "Key control",
              form.keyControl ?? "false",
              (v) => updateField("keyControl", v),
              [
                { value: "false", label: "No" },
                { value: "true", label: "Yes" },
              ],
              true,
            )}

            {textAreaInput("Notes", form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        {nodeType === "TEST_STEP" && (
          <section className="space-y-4">
            {textAreaInput(
              "Description",
              form.description ?? "",
              (v) => updateField("description", v),
              true,
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput("Step no", form.stepNo ?? "", (v) => updateField("stepNo", v))}
              {selectInput(
                "Test method",
                form.testMethod ?? "",
                (v) => updateField("testMethod", v),
                testMethodOptions,
              )}
              {selectInput(
                "Status",
                form.status ?? "NOT_STARTED",
                (v) => updateField("status", v),
                testStepStatusOptions,
                true,
              )}
            </div>

            {textAreaInput(
              "Expected result",
              form.expectedResult ?? "",
              (v) => updateField("expectedResult", v),
            )}
            {textAreaInput(
              "Actual result",
              form.actualResult ?? "",
              (v) => updateField("actualResult", v),
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(
                "Sample reference",
                form.sampleReference ?? "",
                (v) => updateField("sampleReference", v),
              )}
              {textInput(
                "Performed by",
                form.performedBy ?? "",
                (v) => updateField("performedBy", v),
              )}
              {textInput(
                "Reviewed by",
                form.reviewedBy ?? "",
                (v) => updateField("reviewedBy", v),
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {dateInput(
                "Performed at",
                form.performedAt ?? "",
                (v) => updateField("performedAt", v),
              )}
              {dateInput(
                "Reviewed at",
                form.reviewedAt ?? "",
                (v) => updateField("reviewedAt", v),
              )}
            </div>

            {textAreaInput("Notes", form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        {nodeType === "FINDING" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput("Title", form.title ?? "", (v) => updateField("title", v), true)}
              {textInput("Code", form.code ?? "", (v) => updateField("code", v))}
            </div>

            {textAreaInput(
              "Description",
              form.description ?? "",
              (v) => updateField("description", v),
              true,
            )}
            {textAreaInput(
              "Criteria",
              form.criteria ?? "",
              (v) => updateField("criteria", v),
            )}
            {textAreaInput(
              "Condition",
              form.condition ?? "",
              (v) => updateField("condition", v),
            )}
            {textAreaInput("Cause", form.cause ?? "", (v) => updateField("cause", v))}
            {textAreaInput("Effect", form.effect ?? "", (v) => updateField("effect", v))}
            {textAreaInput(
              "Recommendation",
              form.recommendation ?? "",
              (v) => updateField("recommendation", v),
            )}
            {textAreaInput(
              "Management response",
              form.managementResponse ?? "",
              (v) => updateField("managementResponse", v),
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(
                "Action owner",
                form.actionOwner ?? "",
                (v) => updateField("actionOwner", v),
              )}
              {textInput(
                "Severity",
                form.severity ?? "",
                (v) => updateField("severity", v),
                true,
              )}
              {selectInput(
                "Status",
                form.status ?? "DRAFT",
                (v) => updateField("status", v),
                findingStatusOptions,
                true,
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {dateInput("Due date", form.dueDate ?? "", (v) => updateField("dueDate", v))}
              {dateInput(
                "Identified at",
                form.identifiedAt ?? "",
                (v) => updateField("identifiedAt", v),
              )}
              {dateInput(
                "Closed at",
                form.closedAt ?? "",
                (v) => updateField("closedAt", v),
              )}
            </div>

            {textAreaInput("Notes", form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        {nodeType === "EVIDENCE" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput("Title", form.title ?? "", (v) => updateField("title", v), true)}
              {textInput("Type", form.type ?? "", (v) => updateField("type", v), true)}
            </div>

            {textAreaInput(
              "Description",
              form.description ?? "",
              (v) => updateField("description", v),
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput("Source", form.source ?? "", (v) => updateField("source", v))}
              {textInput(
                "Reference number",
                form.referenceNo ?? "",
                (v) => updateField("referenceNo", v),
              )}
              {textInput(
                "External URL",
                form.externalUrl ?? "",
                (v) => updateField("externalUrl", v),
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(
                "Collected by",
                form.collectedBy ?? "",
                (v) => updateField("collectedBy", v),
              )}
              {dateInput(
                "Collected at",
                form.collectedAt ?? "",
                (v) => updateField("collectedAt", v),
              )}
              {textInput("Version", form.version ?? "", (v) => updateField("version", v))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {dateInput(
                "Valid from",
                form.validFrom ?? "",
                (v) => updateField("validFrom", v),
              )}
              {dateInput("Valid to", form.validTo ?? "", (v) => updateField("validTo", v))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(
                "Reliability level",
                form.reliabilityLevel ?? "",
                (v) => updateField("reliabilityLevel", v),
                reliabilityOptions,
              )}
              {selectInput(
                "Confidentiality",
                form.confidentiality ?? "INTERNAL",
                (v) => updateField("confidentiality", v),
                confidentialityOptions,
                true,
              )}
              {selectInput(
                "Status",
                form.status ?? "REQUESTED",
                (v) => updateField("status", v),
                evidenceStatusOptions,
                true,
              )}
            </div>

            {textAreaInput("Notes", form.notes ?? "", (v) => updateField("notes", v))}
          </section>
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
