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

    const expiresAt = accessExpiresAt;

    function checkExpiry() {
      if (Date.now() >= expiresAt) {
        signOut({ callbackUrl: "/login" });
      }
    }

    // immediate check (important after sleep)
    checkExpiry();

    const timeout = setTimeout(checkExpiry, accessExpiresAt - Date.now());

    // check when tab becomes visible again
    document.addEventListener("visibilitychange", checkExpiry);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", checkExpiry);
    };
  }, [accessExpiresAt]);

  return null;
}
/* OLDER VERSION
"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function SessionExpiryGuard({
  accessExpiresAt,
}: {
  accessExpiresAt: number | null;
}) {
  useEffect(() => {
    console.log("SessionExpiryGuard: accessExpiresAt =", accessExpiresAt);
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
  */