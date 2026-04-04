"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAudit() {
    try {
      const res = await fetch(`/api/projects/${projectId}/audit?take=20`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load audit");
      }

      const json = (await res.json()) as AuditResponse;
      setData(json);
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
  }, [projectId]);

  return (
    <section className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-medium">Audit log (recent 20)</h2>
        <Link
          href={`/projects/${projectId}/audit`}
          className="border rounded-md px-3 py-1 text-sm"
        >
          Open all logs
        </Link>
      </div>

      {loading ? (
        <p className="text-sm opacity-70">Loading audit log...</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm opacity-70">No audit entries yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.items.map((a) => (
            <li key={a.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{a.action}</div>
                  <div className="text-xs opacity-70">
                    {a.entity ? `${a.entity}${a.entityId ? ` (${a.entityId})` : ""}` : "—"}
                  </div>
                  <div className="text-xs opacity-60">
                    {new Date(a.createdAt).toLocaleString()} • actor:{" "}
                    {a.actor?.name || a.actor?.email || "system"}
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer underline">details</summary>
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