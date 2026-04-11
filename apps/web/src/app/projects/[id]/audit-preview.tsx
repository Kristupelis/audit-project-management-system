"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/use-t";
import { useLanguage } from "@/providers/language-provider";
import { toUserFriendlyError } from "@/lib/error-message";

type AuditLog = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: unknown;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

type AuditResponse = {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function AuditPreview({ projectId }: { projectId: string }) {
  const t = useT();
  const { locale } = useLanguage();

  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function formatAction(action: string) {
    return t.audit.actions[action as keyof typeof t.audit.actions] ?? action;
  }

  function formatEntity(entity: string | null) {
    if (!entity) return "—";
    return t.audit.entities[entity as keyof typeof t.audit.entities] ?? entity;
  }

  async function loadAudit() {
    try {
      const res = await fetch(`/api/projects/${projectId}/audit?take=20`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(toUserFriendlyError(text || "Failed to load audit.", locale));
      }

      const json = (await res.json()) as AuditResponse;
      setData(json);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : locale === "lt"
            ? "Nepavyko įkelti audito žurnalo."
            : "Failed to load audit log.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAudit();

    const interval = setInterval(() => {
      void loadAudit();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, locale]);

  return (
    <section className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-medium">{t.audit.previewTitle}</h2>
        <Link
          href={`/projects/${projectId}/audit`}
          className="border rounded-md px-3 py-1 text-sm"
        >
          {t.audit.openAllLogs}
        </Link>
      </div>

      {loading ? (
        <p className="text-sm opacity-70">{t.audit.loading}</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm opacity-70">{t.audit.noEntries}</p>
      ) : (
        <ul className="space-y-2">
          {data.items.map((a) => (
            <li key={a.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{formatAction(a.action)}</div>
                  <div className="text-xs opacity-70">
                    {a.entity
                      ? `${formatEntity(a.entity)}${a.entityId ? ` (${a.entityId})` : ""}`
                      : "—"}
                  </div>
                  <div className="text-xs opacity-60">
                    {new Date(a.createdAt).toLocaleString()} • {t.audit.actorLabel}{" "}
                    {a.actor?.name || a.actor?.email || t.audit.systemActor}
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer underline">
                    {t.audit.details}
                  </summary>
                  <pre className="mt-2 border rounded-md p-2 overflow-auto">
                    {JSON.stringify(a.details, null, 2)}
                  </pre>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}