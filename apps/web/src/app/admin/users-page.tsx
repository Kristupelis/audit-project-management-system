"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/use-t";
import { useLanguage } from "@/providers/language-provider";
import { toUserFriendlyError } from "@/lib/error-message";

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
  | { type: "edit"; user: AdminUser }
  | { type: "password"; user: AdminUser }
  | null;

export default function AdminUsersPage() {
  const t = useT();
  const { locale } = useLanguage();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [blockReason, setBlockReason] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(toUserFriendlyError(text || "Failed to load users", locale));
      }

      const data: AdminUsersResponse = JSON.parse(text);
      setCurrentUserId(data.currentUserId);
      setUsers(data.users);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : toUserFriendlyError("", locale),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function openAction(action: PendingAction) {
    setPendingAction(action);
    setError(null);

    if (action?.type === "block") {
      setBlockReason(action.user.blockedReason ?? "");
    } else {
      setBlockReason("");
    }

    if (action?.type === "edit") {
      setEditName(action.user.name ?? "");
      setEditEmail(action.user.email ?? "");
    } else {
      setEditName("");
      setEditEmail("");
    }

    if (action?.type === "password") {
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  function closeAction() {
    setPendingAction(null);
    setBlockReason("");
    setEditName("");
    setEditEmail("");
    setNewPassword("");
    setConfirmPassword("");
  }

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
            reason:
              blockReason.trim() ||
              (locale === "lt"
                ? "Užblokuota administratoriaus"
                : "Blocked by administrator"),
          }),
        });
      } else if (pendingAction.type === "unblock") {
        res = await fetch(`/api/admin/users/${pendingAction.user.id}/unblock`, {
          method: "PATCH",
        });
      } else if (pendingAction.type === "delete") {
        res = await fetch(`/api/admin/users/${pendingAction.user.id}`, {
          method: "DELETE",
        });
      } else if (pendingAction.type === "edit") {
        res = await fetch(`/api/admin/users/${pendingAction.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            email: editEmail,
          }),
        });
      } else {
        if (newPassword !== confirmPassword) {
          throw new Error(
            locale === "lt"
              ? "Nauji slaptažodžiai nesutampa."
              : "New passwords do not match.",
          );
        }

        res = await fetch(`/api/admin/users/${pendingAction.user.id}/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPassword,
          }),
        });
      }

      const text = await res.text();

      if (!res.ok) {
        throw new Error(toUserFriendlyError(text || "Action failed", locale));
      }

      closeAction();
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : toUserFriendlyError("", locale),
      );
      closeAction();
    } finally {
      setActionLoading(false);
    }
  }

  function actionTitle() {
    if (!pendingAction) return "";

    switch (pendingAction.type) {
      case "block":
        return locale === "lt" ? "Užblokuoti naudotoją" : "Block user";
      case "unblock":
        return locale === "lt" ? "Atblokuoti naudotoją" : "Unblock user";
      case "delete":
        return locale === "lt" ? "Pašalinti naudotoją" : "Delete user";
      case "edit":
        return locale === "lt" ? "Redaguoti naudotoją" : "Edit user";
      case "password":
        return locale === "lt"
          ? "Atstatyti slaptažodį"
          : "Reset password";
    }
  }

  function actionMessage() {
    if (!pendingAction) return "";

    const displayName = pendingAction.user.name || pendingAction.user.email;

    switch (pendingAction.type) {
      case "block":
        return locale === "lt"
          ? `Ar tikrai norite užblokuoti naudotoją ${displayName}?`
          : `Are you sure you want to block user ${displayName}?`;
      case "unblock":
        return locale === "lt"
          ? `Ar tikrai norite atblokuoti naudotoją ${displayName}?`
          : `Are you sure you want to unblock user ${displayName}?`;
      case "delete":
        return locale === "lt"
          ? `Ar tikrai norite pašalinti naudotoją ${displayName}?`
          : `Are you sure you want to delete user ${displayName}?`;
      case "edit":
        return locale === "lt"
          ? `Atnaujinkite naudotojo ${displayName} duomenis.`
          : `Update user data for ${displayName}.`;
      case "password":
        return locale === "lt"
          ? `Nustatykite naują slaptažodį naudotojui ${displayName}.`
          : `Set a new password for ${displayName}.`;
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="space-y-4">
        <Link className="underline text-sm" href="/projects">
          ← {t.projects.backToProjects}
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">
            {locale === "lt" ? "Administravimo panelė" : "Admin panel"}
          </h1>
          <p className="text-sm opacity-70">
            {locale === "lt"
              ? "Valdykite naudotojų paskyras."
              : "Manage user accounts."}
          </p>
        </div>
      </div>

      {loading ? <p>{t.common.loading}</p> : null}

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
                        {locale === "lt" ? "Narystės" : "Memberships"}:{" "}
                        {user._count.projectMembers}
                      </span>
                      {user.isBlocked && (
                        <span className="border rounded-full px-2 py-1 text-red-700 border-red-400">
                          {locale === "lt" ? "Užblokuotas" : "Blocked"}
                        </span>
                      )}
                    </div>

                    {user.isBlocked && user.blockedReason && (
                      <p className="text-sm text-red-700">
                        {locale === "lt" ? "Priežastis" : "Reason"}:{" "}
                        {user.blockedReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      className="border rounded-md px-3 py-1 text-sm"
                      onClick={() => openAction({ type: "edit", user })}
                      type="button"
                    >
                      {t.common.edit}
                    </button>

                    <button
                      className="border rounded-md px-3 py-1 text-sm"
                      onClick={() => openAction({ type: "password", user })}
                      type="button"
                    >
                      {locale === "lt" ? "Atstatyti slaptažodį" : "Reset password"}
                    </button>

                    {!user.isBlocked ? (
                      <button
                        className="border rounded-md px-3 py-1 text-sm"
                        onClick={() => openAction({ type: "block", user })}
                        type="button"
                      >
                        {locale === "lt" ? "Blokuoti" : "Block"}
                      </button>
                    ) : (
                      <button
                        className="border rounded-md px-3 py-1 text-sm"
                        onClick={() => openAction({ type: "unblock", user })}
                        type="button"
                      >
                        {locale === "lt" ? "Atblokuoti" : "Unblock"}
                      </button>
                    )}

                    <button
                      className="border rounded-md px-3 py-1 text-sm text-red-700"
                      onClick={() => openAction({ type: "delete", user })}
                      type="button"
                    >
                      {t.common.delete}
                    </button>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      )}

      {pendingAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-red-700">
                    {actionTitle()}
                  </h2>

                  <p className="text-sm text-red-700 whitespace-pre-wrap">
                    {actionMessage()}
                  </p>
                </div>

                {pendingAction.type === "block" && (
                  <div className="space-y-2">
                    <label className="text-sm text-red-700">
                      {locale === "lt" ? "Blokavimo priežastis" : "Block reason"}
                    </label>
                    <textarea
                      className="w-full rounded-md border border-red-300 bg-white p-2 min-h-24 text-sm text-black placeholder:text-gray-500"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                  </div>
                )}

                {pendingAction.type === "edit" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm text-red-700">
                        {locale === "lt" ? "Vardas" : "Name"}
                      </label>
                      <input
                        className="w-full rounded-md border border-red-300 bg-white p-2 text-sm text-black"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm text-red-700">
                        {locale === "lt" ? "El. paštas" : "Email"}
                      </label>
                      <input
                        className="w-full rounded-md border border-red-300 bg-white p-2 text-sm text-black"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {pendingAction.type === "password" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm text-red-700">
                        {locale === "lt" ? "Naujas slaptažodis" : "New password"}
                      </label>
                      <input
                        className="w-full rounded-md border border-red-300 bg-white p-2 text-sm text-black"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
                        title={t.authPages.passwordRequirements}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm text-red-700">
                        {locale === "lt"
                          ? "Pakartokite naują slaptažodį"
                          : "Confirm new password"}
                      </label>
                      <input
                        className="w-full rounded-md border border-red-300 bg-white p-2 text-sm text-black"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
                        title={t.authPages.passwordRequirements}
                        required
                      />
                    </div>

                    <p className="text-xs text-red-700 whitespace-pre-wrap">
                      {t.authPages.passwordRequirements}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={closeAction}
                  disabled={actionLoading}
                  type="button"
                >
                  {t.common.cancel}
                </button>

                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={() => void confirmAction()}
                  disabled={actionLoading}
                  type="button"
                >
                  {actionLoading ? t.common.loading : t.common.save}
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
              {t.common.error}
            </h2>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
            <button
              className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
              onClick={() => setError(null)}
              type="button"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}