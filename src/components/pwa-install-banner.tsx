"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "orchid-pwa-install-dismissed";

export function PwaInstallBanner() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIosDevice);

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      if (!sessionStorage.getItem(DISMISS_KEY)) setVisible(true);
    };

    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari does not expose beforeinstallprompt. Other browsers may also
    // require installation from their own menu.
    const fallbackTimer = window.setTimeout(() => {
      if (!sessionStorage.getItem(DISMISS_KEY)) setVisible(true);
    }, 1800);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setHelpOpen(false);
  };

  const install = async () => {
    if (!promptEvent) {
      setHelpOpen(true);
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") setVisible(false);
    else setHelpOpen(true);
  };

  if (!visible || installed) return null;

  return (
    <aside className="pwa-install-banner" aria-label="Install Orchid One">
      <div className="pwa-install-mark" aria-hidden="true">O</div>
      <div className="pwa-install-copy">
        <strong>Install Orchid One</strong>
        <span>Get quick access from your home screen.</span>
        {helpOpen && (
          <span className="pwa-install-help">
            {ios
              ? 'Tap Share in Safari, then choose “Add to Home Screen”.'
              : 'Open your browser menu and choose “Install app” or “Add to Home screen”.'}
          </span>
        )}
      </div>
      <button className="pwa-install-action" type="button" onClick={install}>
        Install
      </button>
      <button className="pwa-install-dismiss" type="button" onClick={dismiss} aria-label="Dismiss install banner">
        ×
      </button>
    </aside>
  );
}
