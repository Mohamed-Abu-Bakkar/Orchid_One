"use client";

import { useEffect } from "react";

export function PwaServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (cancelled) return;
        registration.update().catch(() => {
          // A failed background update must not affect the current app session.
        });
      })
      .catch((error: unknown) => {
        console.error("Orchid One service worker registration failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
