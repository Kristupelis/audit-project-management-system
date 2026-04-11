"use client";

import { useEffect, useState } from "react";
import { toUserFriendlyError } from "@/lib/error-message";
import { useLanguage } from "@/providers/language-provider";
import { useT } from "@/i18n/use-t";

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
  canTransferOwnership: boolean;
  members: Member[];
};

type PendingAction =
  | { type: "remove"; memberId: string; memberName: string }
  | { type: "transfer"; memberId: string; memberName: string }
  | { type: "removeOwnership"; memberId: string; memberName: string }
  | null;

export default function Members({ projectId }: { projectId: string }) {
  const { locale } = useLanguage();
  const t = useT();

  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canDeleteMembers, setCanDeleteMembers] = useState(false);
  const [canTransferOwnership, setCanTransferOwnership] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  async function loadMembers() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          toUserFriendlyError(text || "Failed to fetch members.", locale),
        );
      }

      const data: MembersResponse = await res.json();
      setMembers(data.members ?? []);
      setCurrentUserId(data.currentUserId);
      setCanDeleteMembers(data.canDeleteMembers);
      setCanTransferOwnership(data.canTransferOwnership);
    } catch (err) {
      setMembers([]);
      setError(
        err instanceof Error
          ? err.message
          : locale === "lt"
            ? "An error occurred."
            : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(toUserFriendlyError(text, locale));
      return;
    }

    setEmail("");
    await loadMembers();
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    setActionLoading(true);

    try {
      if (pendingAction.type === "remove") {
        const res = await fetch(
          `/api/projects/${projectId}/members/${pendingAction.memberId}`,
          {
            method: "DELETE",
          },
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(toUserFriendlyError(text, locale));
        }
      }

      if (pendingAction.type === "removeOwnership") {
        const res = await fetch(`/api/projects/${projectId}/remove-ownership`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberId: pendingAction.memberId }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(toUserFriendlyError(text, locale));
        }
      }

      if (pendingAction.type === "transfer") {
        const res = await fetch(`/api/projects/${projectId}/transfer-ownership`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberId: pendingAction.memberId }),
        });
        

        if (!res.ok) {
          const text = await res.text();
          throw new Error(toUserFriendlyError(text, locale));
        }
      }

      setPendingAction(null);
      await loadMembers();
    } catch (err) {
      setPendingAction(null);
      setError(
        err instanceof Error
          ? err.message
          : locale === "lt"
            ? "An error occurred."
            : "Something went wrong.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  function getMemberDisplayName(member: Member) {
    return member.user.name || member.user.email;
  }

  return (
    <section className="border rounded-xl p-4 space-y-4">
      <h2 className="font-medium">{t.members.title}</h2>

      <form onSubmit={addMember} className="flex gap-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder={t.members.userEmailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="border rounded px-3" type="submit">
          {t.members.add}
        </button>
      </form>

      {members.length === 0 && (
        <p className="text-sm opacity-70">{t.members.noMembers}</p>
      )}

      <ul className="space-y-2">
        {members.map((m) => {
          const isCurrentUser = m.user.id === currentUserId;

          return (
            <li key={m.id} className="border rounded p-3 flex justify-between gap-4">
              <div>
                <div className="font-medium">{getMemberDisplayName(m)}</div>
                <div className="text-xs opacity-70">{m.user.email}</div>
                <div className="text-xs opacity-70 mt-1">
                  {m.isOwner
                    ? t.roles.owner
                    : m.roles.map((r) => r.role.name).join(", ") || t.roles.member}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {!isCurrentUser && canTransferOwnership && !m.isOwner && (
                  <button
                    className="text-sm border rounded px-2 py-1"
                    onClick={() =>
                      setPendingAction({
                        type: "transfer",
                        memberId: m.id,
                        memberName: getMemberDisplayName(m),
                      })
                    }
                    type="button"
                  >
                    {t.members.makeOwner}
                  </button>
                )}

                {!isCurrentUser && canTransferOwnership && m.isOwner && (
                  <button
                    className="text-sm border rounded px-2 py-1"
                    onClick={() =>
                      setPendingAction({
                        type: "removeOwnership",
                        memberId: m.id,
                        memberName: getMemberDisplayName(m),
                      })
                    }
                    type="button"
                  >
                    {locale === "lt" ? "Pašalinti savininką" : "Remove owner"}
                  </button>
                )}

                {!isCurrentUser && canDeleteMembers && (
                  <button
                    className="text-red-600 text-sm"
                    onClick={() =>
                      setPendingAction({
                        type: "remove",
                        memberId: m.id,
                        memberName: getMemberDisplayName(m),
                      })
                    }
                    type="button"
                  >
                    {t.members.remove}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {pendingAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {pendingAction.type === "remove"
                    ? t.members.confirmRemoveTitle
                    : pendingAction.type === "transfer"
                      ? t.members.confirmTransferTitle
                      : locale === "lt"
                        ? "Patvirtinti savininko šalinimą"
                        : "Confirm owner removal"}
                </h3>

                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {pendingAction.type === "remove"
                    ? `${t.members.confirmRemoveMessage} ${pendingAction.memberName}?`
                    : pendingAction.type === "transfer"
                      ? `${t.members.confirmTransferMessage} ${pendingAction.memberName}?`
                      : `${
                          locale === "lt"
                            ? "Ar tikrai norite pašalinti savininko statusą nuo"
                            : "Are you sure you want to remove owner status from"
                        } ${pendingAction.memberName}?`}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={() => setPendingAction(null)}
                  disabled={actionLoading}
                  type="button"
                >
                  {t.common.cancel}
                </button>

                <button
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                  onClick={() => void confirmPendingAction()}
                  disabled={actionLoading}
                  type="button"
                >
                  {actionLoading
                    ? t.common.loading
                    : pendingAction.type === "remove"
                      ? t.members.remove
                      : pendingAction.type === "transfer"
                        ? t.members.makeOwner
                        : locale === "lt"
                          ? "Pašalinti savininką"
                          : "Remove owner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {t.common.error}
                </h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
              </div>

              <button
                className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                onClick={() => setError(null)}
                type="button"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
