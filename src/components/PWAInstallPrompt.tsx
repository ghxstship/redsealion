'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const isDismissedRecently = useCallback(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (!dismissedAt) return false;
      return Date.now() - Number(dismissedAt) < DISMISS_DURATION_MS;
    } catch {
      return false;
    }
  }, []);

  const isStandalone = useCallback(() => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari exposes `navigator.standalone` which is not in standard DOM typings
      'standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true
    );
  }, []);

  useEffect(() => {
    // Don't show if already installed as standalone
    if (isStandalone()) return;
    // Don't show if recently dismissed
    if (isDismissedRecently()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isDismissedRecently, isStandalone]);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      setVisible(false);
    }

    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    setVisible(false);
    deferredPromptRef.current = null;
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl bg-foreground px-4 py-4 text-white shadow-lg sm:px-6 animate-slide-up-toast">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <span className="text-sm font-bold">FD</span>
          </div>
          <p className="text-sm">
            Install FlyteDeck for a faster, app-like experience.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-foreground hover:bg-white/90 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
