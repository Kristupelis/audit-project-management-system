"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  isOwner: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  roles: {
    role: {
      id: string;
      name: string;
    };
  }[];
};

type MembersResponse = {
  currentUserId: string;
  canDeleteMembers: boolean;
  members: Member[];
};

export default function Members({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canDeleteMembers, setCanDeleteMembers] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadMembers() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Failed to fetch members");
        setMembers([]);
        return;
      }

      const data: MembersResponse = await res.json();
      setMembers(data.members ?? []);
      setCurrentUserId(data.currentUserId);
      setCanDeleteMembers(data.canDeleteMembers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const text = await res.text();
      alert(text);
      return;
    }

    setEmail("");
    await loadMembers();
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member?")) return;

    const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const text = await res.text();
      alert(text);
      return;
    }

    await loadMembers();
  }

  async function transferOwnership(memberId: string) {
    if (!confirm("Transfer ownership to this member?")) return;

    const res = await fetch(`/api/projects/${projectId}/transfer-ownership`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberId }),
    });

    if (!res.ok) {
      const text = await res.text();
      alert(text);
      return;
    }

    await loadMembers();
  }

  return (
    <section className="border rounded-xl p-4 space-y-4">
      <h2 className="font-medium">Members</h2>

      <form onSubmit={addMember} className="flex gap-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder="User email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="border rounded px-3">Add</button>
      </form>

      {members.length === 0 && (
        <p className="text-sm opacity-70">No members yet.</p>
      )}

      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="border rounded p-3 flex justify-between gap-4">
            <div>
              <div className="font-medium">{m.user.name || m.user.email}</div>
              <div className="text-xs opacity-70">{m.user.email}</div>
              <div className="text-xs opacity-70 mt-1">
                {m.isOwner
                  ? "OWNER"
                  : m.roles.map((r) => r.role.name).join(", ") || "MEMBER"}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {!m.isOwner && m.user.id !== currentUserId && (
                <button
                  className="text-sm border rounded px-2 py-1"
                  onClick={() => transferOwnership(m.id)}
                  type="button"
                >
                  Make owner
                </button>
              )}

              {canDeleteMembers &&
                !m.isOwner &&
                m.user.id !== currentUserId && (
                  <button
                    className="text-red-600 text-sm"
                    onClick={() => removeMember(m.id)}
                    type="button"
                  >
                    Remove
                  </button>
                )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}