"use client";

import { useEffect, useMemo, useState } from "react";
import { toUserFriendlyError } from "@/lib/error-message";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/providers/language-provider";
import { useT } from "@/i18n/use-t";

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
  placeholder = "Select",
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
        {!required && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CreateComponentForm({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const t = useT();

  const initialNodeType =
    (searchParams.get("nodeType") as NodeType | null) ?? "AUDIT_AREA";
  const initialParentId = searchParams.get("parentId") ?? "";

  const [tree, setTree] = useState<TreeNode[]>([]);
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

  function typeLabel(type: NodeType) {
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
  }

  const nodeStatusOptions = [
    { value: "NOT_STARTED", label: t.structure.notStarted },
    { value: "IN_PROGRESS", label: t.structure.inProgress },
    { value: "COMPLETED", label: t.structure.completed },
    { value: "CLOSED", label: t.structure.closed },
    { value: "NOT_APPLICABLE", label: t.structure.notApplicable },
  ];

  const riskLevelOptions = [
    { value: "LOW", label: t.structure.low },
    { value: "MEDIUM", label: t.structure.medium },
    { value: "HIGH", label: t.structure.high },
    { value: "CRITICAL", label: t.structure.critical },
  ];

  const frequencyOptions = [
    { value: "AD_HOC", label: t.structure.adHoc },
    { value: "DAILY", label: t.structure.daily },
    { value: "WEEKLY", label: t.structure.weekly },
    { value: "MONTHLY", label: t.structure.monthly },
    { value: "QUARTERLY", label: t.structure.quarterly },
    { value: "YEARLY", label: t.structure.yearly },
  ];

  const controlTypeOptions = [
    { value: "PREVENTIVE", label: t.structure.preventive },
    { value: "DETECTIVE", label: t.structure.detective },
    { value: "CORRECTIVE", label: t.structure.corrective },
  ];

  const controlNatureOptions = [
    { value: "MANUAL", label: t.structure.manual },
    { value: "AUTOMATED", label: t.structure.automated },
    { value: "IT_DEPENDENT_MANUAL", label: t.structure.itDependentManual },
  ];

  const testMethodOptions = [
    { value: "INQUIRY", label: t.structure.inquiry },
    { value: "INSPECTION", label: t.structure.inspection },
    { value: "OBSERVATION", label: t.structure.observation },
    { value: "REPERFORMANCE", label: t.structure.reperformance },
    { value: "WALKTHROUGH", label: t.structure.walkthrough },
    { value: "ANALYTICAL_PROCEDURE", label: t.structure.analyticalProcedure },
    { value: "MIXED", label: t.structure.mixed },
  ];

  const testStepStatusOptions = [
    { value: "NOT_STARTED", label: t.structure.notStarted },
    { value: "IN_PROGRESS", label: t.structure.inProgress },
    { value: "PASSED", label: t.structure.passed },
    { value: "FAILED", label: t.structure.failed },
    { value: "BLOCKED", label: t.structure.blocked },
    { value: "NOT_APPLICABLE", label: t.structure.notApplicable },
  ];

  const findingStatusOptions = [
    { value: "DRAFT", label: t.structure.draft },
    { value: "OPEN", label: t.structure.openStatus },
    { value: "ACCEPTED", label: t.structure.accepted },
    { value: "IN_PROGRESS", label: t.structure.inProgress },
    { value: "RESOLVED", label: t.structure.resolved },
    { value: "CLOSED", label: t.structure.closed },
    { value: "REJECTED", label: t.structure.rejected },
  ];

  const evidenceStatusOptions = [
    { value: "REQUESTED", label: t.structure.requested },
    { value: "RECEIVED", label: t.structure.received },
    { value: "REVIEWED", label: t.structure.reviewed },
    { value: "ACCEPTED", label: t.structure.accepted },
    { value: "REJECTED", label: t.structure.rejected },
  ];

  const reliabilityOptions = [
    { value: "LOW", label: t.structure.low },
    { value: "MEDIUM", label: t.structure.medium },
    { value: "HIGH", label: t.structure.high },
  ];

  const confidentialityOptions = [
    { value: "PUBLIC", label: t.structure.public },
    { value: "INTERNAL", label: t.structure.internal },
    { value: "CONFIDENTIAL", label: t.structure.confidential },
    { value: "RESTRICTED", label: t.structure.restricted },
  ];

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
            toUserFriendlyError(text || t.rolesManagement.loadStructureFailed, locale),
          );
        }

        const data = (await res.json()) as StructureResponse;
        setTree(data.tree);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : toUserFriendlyError("", locale),
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStructure();
  }, [projectId, locale, t.rolesManagement.loadStructureFailed]);

  useEffect(() => {
    setParentId((prev) => {
      const queryParentId = searchParams.get("parentId") ?? "";
      const queryNodeType = searchParams.get("nodeType") as NodeType | null;

      if (queryParentId && queryNodeType === nodeType) {
        return queryParentId;
      }

      return prev && queryNodeType !== nodeType ? "" : prev;
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
  }, [nodeType, searchParams]);

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
                      recommendation: form.recommendation?.trim() || undefined,
                      managementResponse: form.managementResponse?.trim() || undefined,
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
                      reliabilityLevel: form.reliabilityLevel || undefined,
                      confidentiality: form.confidentiality || undefined,
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
          toUserFriendlyError(text || t.structure.createComponent, locale),
        );
      }

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : toUserFriendlyError("", locale),
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
          <label className="block text-sm">{t.structure.componentType}</label>
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
              {t.structure.selectParent} {typeLabel(requiredParentType).toLowerCase()}
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">{t.structure.selectParent}</option>
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
              {textInput(t.structure.name, form.name ?? "", (v) => updateField("name", v), true)}
              {textInput(t.structure.code, form.code ?? "", (v) => updateField("code", v))}
            </div>

            {textAreaInput(t.structure.description, form.description ?? "", (v) => updateField("description", v))}
            {textAreaInput(t.structure.objective, form.objective ?? "", (v) => updateField("objective", v))}
            {textAreaInput(t.structure.scope, form.scope ?? "", (v) => updateField("scope", v))}

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(t.structure.riskLevel, form.riskLevel ?? "", (v) => updateField("riskLevel", v), riskLevelOptions, false, t.structure.selectParent)}
              {selectInput(t.structure.residualRisk, form.residualRisk ?? "", (v) => updateField("residualRisk", v), riskLevelOptions, false, t.structure.selectParent)}
              {selectInput(t.structure.status, form.status ?? "NOT_STARTED", (v) => updateField("status", v), nodeStatusOptions, true)}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {textInput(t.structure.areaOwner, form.areaOwner ?? "", (v) => updateField("areaOwner", v))}
              {textAreaInput(t.structure.notes, form.notes ?? "", (v) => updateField("notes", v))}
            </div>
          </section>
        )}

        {nodeType === "PROCESS" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput(t.structure.name, form.name ?? "", (v) => updateField("name", v), true)}
              {textInput(t.structure.code, form.code ?? "", (v) => updateField("code", v))}
            </div>

            {textAreaInput(t.structure.description, form.description ?? "", (v) => updateField("description", v))}
            {textAreaInput(t.structure.objective, form.objective ?? "", (v) => updateField("objective", v))}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(t.structure.processOwner, form.processOwner ?? "", (v) => updateField("processOwner", v))}
              {selectInput(t.structure.frequency, form.frequency ?? "", (v) => updateField("frequency", v), frequencyOptions, false, t.rolesManagement.selectItem)}
              {selectInput(t.structure.riskLevel, form.riskLevel ?? "", (v) => updateField("riskLevel", v), riskLevelOptions, false, t.rolesManagement.selectItem)}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(t.structure.status, form.status ?? "NOT_STARTED", (v) => updateField("status", v), nodeStatusOptions, true)}
              {textInput(t.structure.systemsInvolved, form.systemsInvolved ?? "", (v) => updateField("systemsInvolved", v))}
              {textInput(t.structure.keyInputs, form.keyInputs ?? "", (v) => updateField("keyInputs", v))}
            </div>

            {textInput(t.structure.keyOutputs, form.keyOutputs ?? "", (v) => updateField("keyOutputs", v))}
            {textAreaInput(t.structure.notes, form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        {nodeType === "CONTROL" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput(t.structure.name, form.name ?? "", (v) => updateField("name", v), true)}
              {textInput(t.structure.code, form.code ?? "", (v) => updateField("code", v))}
            </div>

            {textAreaInput(t.structure.description, form.description ?? "", (v) => updateField("description", v))}
            {textAreaInput(t.structure.controlObjective, form.controlObjective ?? "", (v) => updateField("controlObjective", v))}

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(t.structure.controlType, form.controlType ?? "", (v) => updateField("controlType", v), controlTypeOptions, false, t.structure.selectParent)}
              {selectInput(t.structure.controlNature, form.controlNature ?? "", (v) => updateField("controlNature", v), controlNatureOptions, false, t.structure.selectParent)}
              {textInput(t.structure.controlOwner, form.controlOwner ?? "", (v) => updateField("controlOwner", v))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(t.structure.frequency, form.frequency ?? "", (v) => updateField("frequency", v), frequencyOptions, false, t.structure.selectParent)}
              {selectInput(t.structure.testingStrategy, form.testingStrategy ?? "", (v) => updateField("testingStrategy", v), testMethodOptions, false, t.structure.selectParent)}
              {selectInput(t.structure.status, form.status ?? "NOT_STARTED", (v) => updateField("status", v), nodeStatusOptions, true)}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {textInput(t.structure.relatedRisk, form.relatedRisk ?? "", (v) => updateField("relatedRisk", v))}
              {textInput(t.structure.expectedEvidence, form.expectedEvidence ?? "", (v) => updateField("expectedEvidence", v))}
            </div>

            {selectInput(
              t.structure.keyControl,
              form.keyControl ?? "false",
              (v) => updateField("keyControl", v),
              [
                { value: "false", label: t.structure.no },
                { value: "true", label: t.structure.yes },
              ],
              true,
            )}

            {textAreaInput(t.structure.notes, form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        {nodeType === "TEST_STEP" && (
          <section className="space-y-4">
            {textAreaInput(t.structure.description, form.description ?? "", (v) => updateField("description", v), true)}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(t.structure.stepNo, form.stepNo ?? "", (v) => updateField("stepNo", v))}
              {selectInput(t.structure.testMethod, form.testMethod ?? "", (v) => updateField("testMethod", v), testMethodOptions, false, t.structure.selectParent)}
              {selectInput(t.structure.status, form.status ?? "NOT_STARTED", (v) => updateField("status", v), testStepStatusOptions, true)}
            </div>

            {textAreaInput(t.structure.expectedResult, form.expectedResult ?? "", (v) => updateField("expectedResult", v))}
            {textAreaInput(t.structure.actualResult, form.actualResult ?? "", (v) => updateField("actualResult", v))}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(t.structure.sampleReference, form.sampleReference ?? "", (v) => updateField("sampleReference", v))}
              {textInput(t.structure.performedBy, form.performedBy ?? "", (v) => updateField("performedBy", v))}
              {textInput(t.structure.reviewedBy, form.reviewedBy ?? "", (v) => updateField("reviewedBy", v))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {dateInput(t.structure.performedAt, form.performedAt ?? "", (v) => updateField("performedAt", v))}
              {dateInput(t.structure.reviewedAt, form.reviewedAt ?? "", (v) => updateField("reviewedAt", v))}
            </div>

            {textAreaInput(t.structure.notes, form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        {nodeType === "FINDING" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput(t.structure.title, form.title ?? "", (v) => updateField("title", v), true)}
              {textInput(t.structure.code, form.code ?? "", (v) => updateField("code", v))}
            </div>

            {textAreaInput(t.structure.description, form.description ?? "", (v) => updateField("description", v), true)}
            {textAreaInput(t.structure.criteria, form.criteria ?? "", (v) => updateField("criteria", v))}
            {textAreaInput(t.structure.condition, form.condition ?? "", (v) => updateField("condition", v))}
            {textAreaInput(t.structure.cause, form.cause ?? "", (v) => updateField("cause", v))}
            {textAreaInput(t.structure.effect, form.effect ?? "", (v) => updateField("effect", v))}
            {textAreaInput(t.structure.recommendation, form.recommendation ?? "", (v) => updateField("recommendation", v))}
            {textAreaInput(t.structure.managementResponse, form.managementResponse ?? "", (v) => updateField("managementResponse", v))}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(t.structure.actionOwner, form.actionOwner ?? "", (v) => updateField("actionOwner", v))}
              {textInput(t.structure.severity, form.severity ?? "", (v) => updateField("severity", v), true)}
              {selectInput(t.structure.status, form.status ?? "DRAFT", (v) => updateField("status", v), findingStatusOptions, true)}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {dateInput(t.structure.dueDate, form.dueDate ?? "", (v) => updateField("dueDate", v))}
              {dateInput(t.structure.identifiedAt, form.identifiedAt ?? "", (v) => updateField("identifiedAt", v))}
              {dateInput(t.structure.closedAt, form.closedAt ?? "", (v) => updateField("closedAt", v))}
            </div>

            {textAreaInput(t.structure.notes, form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        {nodeType === "EVIDENCE" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {textInput(t.structure.title, form.title ?? "", (v) => updateField("title", v), true)}
              {textInput(t.structure.type, form.type ?? "", (v) => updateField("type", v), true)}
            </div>

            {textAreaInput(t.structure.description, form.description ?? "", (v) => updateField("description", v))}

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(t.structure.source, form.source ?? "", (v) => updateField("source", v))}
              {textInput(t.structure.referenceNo, form.referenceNo ?? "", (v) => updateField("referenceNo", v))}
              {textInput(t.structure.externalUrl, form.externalUrl ?? "", (v) => updateField("externalUrl", v))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {textInput(t.structure.collectedBy, form.collectedBy ?? "", (v) => updateField("collectedBy", v))}
              {dateInput(t.structure.collectedAt, form.collectedAt ?? "", (v) => updateField("collectedAt", v))}
              {textInput(t.structure.version, form.version ?? "", (v) => updateField("version", v))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {dateInput(t.structure.validFrom, form.validFrom ?? "", (v) => updateField("validFrom", v))}
              {dateInput(t.structure.validTo, form.validTo ?? "", (v) => updateField("validTo", v))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectInput(t.structure.reliabilityLevel, form.reliabilityLevel ?? "", (v) => updateField("reliabilityLevel", v), reliabilityOptions, false, t.structure.selectParent)}
              {selectInput(t.structure.confidentiality, form.confidentiality ?? "INTERNAL", (v) => updateField("confidentiality", v), confidentialityOptions, true)}
              {selectInput(t.structure.status, form.status ?? "REQUESTED", (v) => updateField("status", v), evidenceStatusOptions, true)}
            </div>

            {textAreaInput(t.structure.notes, form.notes ?? "", (v) => updateField("notes", v))}
          </section>
        )}

        <div className="flex gap-2">
          <button className="border rounded px-3 py-2" disabled={submitting}>
            {submitting ? t.structure.creatingComponent : t.structure.createComponent}
          </button>

          <button
            type="button"
            className="border rounded px-3 py-2"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            {t.common.cancel}
          </button>
        </div>
      </form>
    </section>
  );
}