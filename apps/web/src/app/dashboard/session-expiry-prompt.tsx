"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SessionExpiryPrompt({
  accessExpiresAt,
  thresholdMs = 1 * 60 * 1000, // default 1 min
}: {
  accessExpiresAt: number | null;
  thresholdMs?: number;
}) {
  const router = useRouter();
  const promptedRef = useRef(false);

  useEffect(() => {
    promptedRef.current = false;
  }, [accessExpiresAt]);

  useEffect(() => {
    if (!accessExpiresAt) return;

    const remaining = accessExpiresAt - Date.now();
    if (remaining <= 0) return;

    const fireIn = Math.max(remaining - thresholdMs, 0);

    const t = setTimeout(() => {
      if (promptedRef.current) return;
      promptedRef.current = true;

      const extend = window.confirm("Your session will expire soon. Extend session?");
      if (extend) {
        router.refresh(); // triggers NextAuth jwt refresh when expired
      }
    }, fireIn);

    return () => clearTimeout(t);
  }, [accessExpiresAt, thresholdMs, router]);

  return null;
}