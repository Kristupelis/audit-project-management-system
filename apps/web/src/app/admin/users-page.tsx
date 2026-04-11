"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  systemRole: string;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
  _count: {
    projectMembers: number;
  };
};

type AdminUsersResponse = {
  currentUserId: string;
  users: AdminUser[];
};

type PendingAction =
  | { type: "block"; user: AdminUser }
  | { type: "unblock"; user: AdminUser }
  | { type: "delete"; user: AdminUser }
  | null;

type Props = {
  backLabel: string;
  title: string;
  subtitle: string;
  blockLabel: string;
  unblockLabel: string;
  deleteLabel: string;
  blockedLabel: string;
  membershipsLabel: string;
  reasonLabel: string;
  loadingLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  errorLabel: string;
  closeLabel: string;
  blockUserTitle: string;
  unblockUserTitle: string;
  deleteUserTitle: string;
  blockReasonLabel: string;
  confirmBlockText: string;
  confirmUnblockText: string;
  confirmDeleteText: string;
  adminPathLabel: string;
};

export default function AdminUsersPage(props: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Failed to load users");
      }

      const data: AdminUsersResponse = JSON.parse(text);
      setCurrentUserId(data.currentUserId);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function confirmAction() {
    if (!pendingAction) return;

    setActionLoading(true);
    setError(null);

    try {
      let res: Response;

      if (pendingAction.type === "block") {
        res = await fetch(`/api/admin/users/${pendingAction.user.id}/block`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: blockReason.trim() || "Blocked by administrator",
          }),
        });
      } else if (pendingAction.type === "unblock") {
        res = await fetch(`/api/admin/users/${pendingAction.user.id}/unblock`, {
          method: "PATCH",
        });
      } else {
        res = await fetch(`/api/admin/users/${pendingAction.user.id}`, {
          method: "DELETE",
        });
      }

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Action failed");
      }

      setPendingAction(null);
      setBlockReason("");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPendingAction(null);
      setBlockReason("");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="space-y-4">
        <Link className="underline text-sm" href="/projects">
          ← {props.backLabel}
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">{props.title}</h1>
          <p className="text-sm opacity-70">{props.subtitle}</p>
        </div>
      </div>

      {loading ? <p>{props.loadingLabel}</p> : null}

      {!loading && (
        <ul className="space-y-3">
          {users
            .filter((user) => user.id !== currentUserId)
            .map((user) => (
              <li key={user.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-sm opacity-70">{user.email}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="border rounded-full px-2 py-1">
                        {user.systemRole}
                      </span>
                      <span className="border rounded-full px-2 py-1">
                        {props.membershipsLabel}: {user._count.projectMembers}
                      </span>
                      {user.isBlocked && (
                        <span className="border rounded-full px-2 py-1 text-red-700 border-red-400">
                          {props.blockedLabel}
                        </span>
                      )}
                    </div>
                    {user.isBlocked && user.blockedReason && (
                      <p className="text-sm text-red-700">
                        {props.reasonLabel}: {user.blockedReason}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!user.isBlocked ? (
                      <button
                        className="border rounded-md px-3 py-1 text-sm"
                        onClick={() => setPendingAction({ type: "block", user })}
                        type="button"
                      >
                        {props.blockLabel}
                      </button>
                    ) : (
                      <button
                        className="border rounded-md px-3 py-1 text-sm"
                        onClick={() => setPendingAction({ type: "unblock", user })}
                        type="button"
                      >
                        {props.unblockLabel}
                      </button>
                    )}

                    <button
                      className="border rounded-md px-3 py-1 text-sm text-red-700"
                      onClick={() => setPendingAction({ type: "delete", user })}
                      type="button"
                    >
                      {props.deleteLabel}
                    </button>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      )}

      {pendingAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold text-red-700">
                    {pendingAction.type === "block"
                        ? props.blockUserTitle
                        : pendingAction.type === "unblock"
                        ? props.unblockUserTitle
                        : props.deleteUserTitle}
                    </h2>

                    <p className="text-sm text-red-700 whitespace-pre-wrap">
                    {pendingAction.type === "block" &&
                        `${props.confirmBlockText} ${pendingAction.user.name || pendingAction.user.email}?`}
                    {pendingAction.type === "unblock" &&
                        `${props.confirmUnblockText} ${pendingAction.user.name || pendingAction.user.email}?`}
                    {pendingAction.type === "delete" &&
                        `${props.confirmDeleteText} ${pendingAction.user.name || pendingAction.user.email}?`}
                    </p>
                </div>

                {pendingAction.type === "block" && (
                    <div className="space-y-2">
                    <label className="text-sm text-red-700">
                        {props.blockReasonLabel}
                    </label>
                    <textarea
                        className="w-full rounded-md border border-red-300 bg-white p-2 min-h-24 text-sm text-black placeholder:text-gray-500"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                    />
                    </div>
                )}
                </div>

                <div className="flex gap-2">
                <button
                    className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                    onClick={() => {
                    setPendingAction(null);
                    setBlockReason("");
                    }}
                    disabled={actionLoading}
                    type="button"
                >
                    {props.cancelLabel}
                </button>

                <button
                    className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                    onClick={() => void confirmAction()}
                    disabled={actionLoading}
                    type="button"
                >
                    {actionLoading ? props.loadingLabel : props.confirmLabel}
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

      {error && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-red-400 bg-red-50 p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-red-700">
              {props.errorLabel}
            </h2>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
            <button
              className="border rounded-md px-3 py-1"
              onClick={() => setError(null)}
              type="button"
            >
              {props.closeLabel}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}