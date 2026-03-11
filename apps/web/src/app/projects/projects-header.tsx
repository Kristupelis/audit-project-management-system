"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function ProjectsHeader({
  name,
}: {
  name: string | null | undefined;
}) {
  async function handleSignOut() {
    const confirm = window.confirm("Sign out?");
    if (!confirm) return;

    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm opacity-80">
          Logged in as: <span className="font-medium">{name ?? "User"}</span>
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/account"
          className="border rounded-md px-3 py-2 hover:bg-gray-800"
        >
          Account
        </Link>


        <button
            onClick={handleSignOut}
            className="border rounded-md px-3 py-2 hover:bg-gray-800"
        >
            Sign out
        </button>
        </div>
    </div>
  );
}