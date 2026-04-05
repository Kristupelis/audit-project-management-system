"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/use-t";
import { useLanguage } from "@/providers/language-provider";
import { toUserFriendlyError } from "@/lib/error-message";
import ErrorModal from "@/components/error-modal";

type MeResponse = {
  id: string;
  email: string;
  name: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const t = useT();
  const { locale } = useLanguage();

  const token = session?.apiAccessToken;

  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;

      setProfileLoading(true);
      setError(null);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(toUserFriendlyError(text, locale));
        }

        const data = (await res.json()) as MeResponse;
        setName(data.name ?? "");
        setEmail(data.email ?? "");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : toUserFriendlyError("", locale),
        );
      } finally {
        setProfileLoading(false);
      }
    }

    void loadProfile();
  }, [token, locale]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(toUserFriendlyError(text, locale));
      }

      await update({
        user: {
          ...session?.user,
          name,
          email,
        },
      });

      setSuccess(
        locale === "lt"
          ? "Paskyros informacija sėkmingai atnaujinta."
          : "Account information updated successfully.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : toUserFriendlyError("", locale),
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSavingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error(
          locale === "lt"
            ? "Nauji slaptažodžiai nesutampa."
            : "New passwords do not match.",
        );
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(toUserFriendlyError(text, locale));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        locale === "lt"
          ? "Slaptažodis pakeistas. Prisijunkite iš naujo."
          : "Password changed. Please sign in again.",
      );

      await signOut({ callbackUrl: "/login" });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : toUserFriendlyError("", locale),
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (status === "loading" || profileLoading) {
    return <main className="p-6">{t.common.loading}</main>;
  }

  if (!session) {
    return <main className="p-6">{t.accountPage.pleaseLoginFirst}</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <div className="space-y-2">
        <Link href="/projects" className="underline text-sm">
          ← {t.projects.backToProjects}
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">{t.accountPage.title}</h1>
          <p className="text-sm opacity-80">
            {t.accountPage.loggedInAs}{" "}
            <span className="font-medium">
              {session.user?.name ?? session.user?.email}
            </span>
          </p>
        </div>
      </div>

      {success && (
        <div className="border rounded p-3 text-sm bg-green-50 border-green-300 text-green-700">
          {success}
        </div>
      )}

      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">
          {locale === "lt" ? "Paskyros informacija" : "Account information"}
        </h2>

        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm">
              {locale === "lt" ? "Vardas" : "Name"}
            </label>
            <input
              className="w-full border rounded-md p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === "lt" ? "Jūsų vardas" : "Your name"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">
              {locale === "lt" ? "El. paštas" : "Email"}
            </label>
            <input
              className="w-full border rounded-md p-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            className="border rounded-md px-3 py-2 disabled:opacity-50"
            disabled={savingProfile}
          >
            {savingProfile
              ? locale === "lt"
                ? "Saugoma..."
                : "Saving..."
              : t.common.save}
          </button>
        </form>
      </section>

      <section className="border rounded-xl p-4 space-y-4">
        <h2 className="font-medium">
          {locale === "lt" ? "Slaptažodžio keitimas" : "Change password"}
        </h2>

        <form onSubmit={savePassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm">
              {locale === "lt" ? "Dabartinis slaptažodis" : "Current password"}
            </label>
            <input
              className="w-full border rounded-md p-2"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">
              {locale === "lt" ? "Naujas slaptažodis" : "New password"}
            </label>
            <input
              className="w-full border rounded-md p-2"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
              title={t.authPages.passwordRequirements}
              required
            />
            <p className="text-xs opacity-70">{t.authPages.passwordRequirements}</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm">
              {locale === "lt"
                ? "Pakartokite naują slaptažodį"
                : "Confirm new password"}
            </label>
            <input
              className="w-full border rounded-md p-2"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
              title={t.authPages.passwordRequirements}
              required
            />
          </div>

          <button
            className="border rounded-md px-3 py-2 disabled:opacity-50"
            disabled={savingPassword}
          >
            {savingPassword
              ? locale === "lt"
                ? "Saugoma..."
                : "Saving..."
              : locale === "lt"
                ? "Pakeisti slaptažodį"
                : "Change password"}
          </button>
        </form>
      </section>

      <ErrorModal
        message={error}
        onClose={() => setError(null)}
        title={t.common.error}
        closeLabel={t.common.close}
      />
    </main>
  );
}