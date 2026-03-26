"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed (${res.status})`);
      }

      setName("");
      setDescription("");
      router.refresh(); // refresh server-rendered list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm">Project name</label>
        <input
          className="w-full border rounded-md p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm">Description (optional)</label>
        <textarea
          className="w-full border rounded-md p-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button className="border rounded-md px-3 py-2 disabled:opacity-50 hover:bg-gray-800" disabled={loading}>
        {loading ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}
