"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function SessionExpiryGuard({
  accessExpiresAt,
}: {
  accessExpiresAt: number | null;
}) {
  useEffect(() => {
    if (!accessExpiresAt) return;

    const interval = setInterval(() => {
      if (Date.now() >= accessExpiresAt) {
        signOut({ callbackUrl: "/login" });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [accessExpiresAt]);

  return null;
}