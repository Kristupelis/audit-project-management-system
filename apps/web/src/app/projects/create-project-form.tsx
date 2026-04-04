"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toUserFriendlyError } from "@/lib/error-message";

type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "FIELDWORK"
  | "REVIEW"
  | "CLOSED"
  | "ARCHIVED";

type AuditType =
  | "INTERNAL"
  | "EXTERNAL"
  | "IT"
  | "FINANCIAL"
  | "COMPLIANCE"
  | "OPERATIONAL"
  | "OTHER";

type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type ProjectFormData = {
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  auditType: AuditType;
  priority: PriorityLevel;
  scope: string;
  objective: string;
  methodology: string;
  auditedEntityName: string;
  location: string;
  engagementLead: string;
  periodStart: string;
  periodEnd: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
};

export default function CreateProjectForm({
  mode = "create",
  initialValues,
  projectId,
}: {
  mode?: "create" | "edit";
  initialValues?: Partial<ProjectFormData>;
  projectId?: string;
}) {
  const router = useRouter();

  const [form, setForm] = useState<ProjectFormData>({
    name: initialValues?.name ?? "",
    code: initialValues?.code ?? "",
    description: initialValues?.description ?? "",
    status: initialValues?.status ?? "PLANNING",
    auditType: initialValues?.auditType ?? "INTERNAL",
    priority: initialValues?.priority ?? "MEDIUM",
    scope: initialValues?.scope ?? "",
    objective: initialValues?.objective ?? "",
    methodology: initialValues?.methodology ?? "",
    auditedEntityName: initialValues?.auditedEntityName ?? "",
    location: initialValues?.location ?? "",
    engagementLead: initialValues?.engagementLead ?? "",
    periodStart: initialValues?.periodStart ?? "",
    periodEnd: initialValues?.periodEnd ?? "",
    plannedStartDate: initialValues?.plannedStartDate ?? "",
    plannedEndDate: initialValues?.plannedEndDate ?? "",
    actualStartDate: initialValues?.actualStartDate ?? "",
    actualEndDate: initialValues?.actualEndDate ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        status: form.status,
        auditType: form.auditType,
        priority: form.priority,
        scope: form.scope.trim() || undefined,
        objective: form.objective.trim() || undefined,
        methodology: form.methodology.trim() || undefined,
        auditedEntityName: form.auditedEntityName.trim() || undefined,
        location: form.location.trim() || undefined,
        engagementLead: form.engagementLead.trim() || undefined,
        periodStart: form.periodStart || undefined,
        periodEnd: form.periodEnd || undefined,
        plannedStartDate: form.plannedStartDate || undefined,
        plannedEndDate: form.plannedEndDate || undefined,
        actualStartDate: form.actualStartDate || undefined,
        actualEndDate: form.actualEndDate || undefined,
      };

      const url =
        mode === "edit" && projectId ? `/api/projects/${projectId}` : "/api/projects";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(toUserFriendlyError(text || `Failed (${res.status})`));
      }

      if (mode === "edit" && projectId) {
        router.push(`/projects/${projectId}`);
      } else {
        router.push("/projects");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">Basic information</h2>

        <div className="space-y-1">
          <label className="text-sm">Project name</label>
          <input
            className="w-full border rounded-md p-2"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            minLength={2}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Project code</label>
          <input
            className="w-full border rounded-md p-2"
            value={form.code}
            onChange={(e) => updateField("code", e.target.value)}
            placeholder="AUD-2025-001"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm">Status</label>
            <select
              className="w-full border rounded-md p-2"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value as ProjectStatus)}
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="FIELDWORK">Fieldwork</option>
              <option value="REVIEW">Review</option>
              <option value="CLOSED">Closed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Audit type</label>
            <select
              className="w-full border rounded-md p-2"
              value={form.auditType}
              onChange={(e) => updateField("auditType", e.target.value as AuditType)}
            >
              <option value="INTERNAL">Internal</option>
              <option value="EXTERNAL">External</option>
              <option value="IT">IT</option>
              <option value="FINANCIAL">Financial</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Priority</label>
            <select
              className="w-full border rounded-md p-2"
              value={form.priority}
              onChange={(e) => updateField("priority", e.target.value as PriorityLevel)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Description</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={3}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">Audit details</h2>

        <div className="space-y-1">
          <label className="text-sm">Scope</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={3}
            value={form.scope}
            onChange={(e) => updateField("scope", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Objective</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={3}
            value={form.objective}
            onChange={(e) => updateField("objective", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Methodology / standard</label>
          <input
            className="w-full border rounded-md p-2"
            value={form.methodology}
            onChange={(e) => updateField("methodology", e.target.value)}
          />
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">Context</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm">Audited entity</label>
            <input
              className="w-full border rounded-md p-2"
              value={form.auditedEntityName}
              onChange={(e) => updateField("auditedEntityName", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Location</label>
            <input
              className="w-full border rounded-md p-2"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Lead auditor</label>
            <input
              className="w-full border rounded-md p-2"
              value={form.engagementLead}
              onChange={(e) => updateField("engagementLead", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">Dates</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Audited period start", "periodStart"],
            ["Audited period end", "periodEnd"],
            ["Planned start date", "plannedStartDate"],
            ["Planned end date", "plannedEndDate"],
            ["Actual start date", "actualStartDate"],
            ["Actual end date", "actualEndDate"],
          ].map(([label, key]) => (
            <div key={key} className="space-y-1">
              <label className="text-sm">{label}</label>
              <input
                type="date"
                className="w-full border rounded-md p-2"
                value={form[key as keyof ProjectFormData] as string}
                onChange={(e) =>
                  updateField(key as keyof ProjectFormData, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button className="border rounded-md px-3 py-2 disabled:opacity-50" disabled={loading}>
          {loading
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
              ? "Save changes"
              : "Create project"}
        </button>
      </div>
    </form>
  );
}