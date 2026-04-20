"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SystemLogItem = {
  id: string;
  level: string;
  action: string;
  message: string;
  createdAt: string;
  details?: Record<string, unknown> | unknown[] | null;
  actorUser?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  targetUser?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

type ResponseData = {
  items: SystemLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Props = {
  backLabel: string;
  title: string;
  subtitle: string;
  loadingLabel: string;
  errorLabel: string;
  closeLabel: string;
};

export default function AdminSystemLogsPage(props: Props) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/system-logs", {
        cache: "no-store",
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Failed to load system logs");
      }

      setData(JSON.parse(text) as ResponseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <div className="space-y-4">
        <Link className="underline text-sm" href="/admin">
          ← {props.backLabel}
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">{props.title}</h1>
          <p className="text-sm opacity-70">{props.subtitle}</p>
        </div>
      </div>

      {loading ? <p>{props.loadingLabel}</p> : null}

      {!loading && data && (
        <ul className="space-y-3">
          {data.items.map((item) => (
            <li key={item.id} className="border rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="border rounded-full px-2 py-1">{item.level}</span>
                <span className="border rounded-full px-2 py-1">{item.action}</span>
              </div>

              <div className="font-medium">{item.message}</div>

              <div className="text-sm opacity-70">
                {new Date(item.createdAt).toLocaleString()}
              </div>

              {item.actorUser && (
                <div className="text-sm opacity-80">
                  Actor: {item.actorUser.name || item.actorUser.email}
                </div>
              )}

              {item.targetUser && (
                <div className="text-sm opacity-80">
                  Target: {item.targetUser.name || item.targetUser.email}
                </div>
              )}

              {item.details != null && (
                <pre className="text-xs border rounded-md p-3 overflow-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(item.details, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-red-700">
                  {props.errorLabel}
                </h2>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {error}
                </p>
              </div>

              <button
                className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                onClick={() => setError(null)}
                type="button"
              >
                {props.closeLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}