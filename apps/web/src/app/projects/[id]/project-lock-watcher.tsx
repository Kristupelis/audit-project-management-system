"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  projectId: string;
  redirectTo?: string;
  intervalMs?: number;
};

export default function ProjectLockWatcher({
  projectId,
  redirectTo = "/projects",
  intervalMs = 15000,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          cache: "no-store",
        });

        if (cancelled) return;

        if (res.ok) return;

        const text = await res.text().catch(() => "");

        if (
          res.status === 403 &&
          text.toLowerCase().includes("project_locked")
        ) {
          router.replace(redirectTo);
          router.refresh();
        }
      } catch {
        // ignore temporary network errors
      }
    }

    void checkAccess();

    const interval = window.setInterval(() => {
      void checkAccess();
    }, intervalMs);

    const onFocus = () => {
      void checkAccess();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkAccess();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [projectId, redirectTo, intervalMs, router]);

  return null;
}