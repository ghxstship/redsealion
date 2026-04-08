'use client';

import { useEffect, useRef, useCallback } from 'react';

export default function ServiceWorkerRegistration() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateBannerRef = useRef<HTMLDivElement | null>(null);

  const showUpdateBanner = useCallback(() => {
    // Remove existing banner if present
    if (updateBannerRef.current) {
      updateBannerRef.current.remove();
    }

    const banner = document.createElement('div');
    banner.setAttribute(
      'style',
      'position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 16px;background:#0a0a0a;color:#fff;font-size:14px;font-family:system-ui,sans-serif;'
    );
    banner.innerHTML = `
      <span>New version available</span>
      <button id="sw-update-btn" style="padding:4px 12px;border-radius:6px;background:#fff;color:#0a0a0a;font-size:13px;font-weight:500;border:none;cursor:pointer;">
        Update
      </button>
    `;
    document.body.appendChild(banner);
    updateBannerRef.current = banner;

    const btn = document.getElementById('sw-update-btn');
    btn?.addEventListener('click', () => {
      const waiting = registrationRef.current?.waiting;
      if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        registrationRef.current = registration;

        // Check for updates on registration
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New version available
              showUpdateBanner();
            }
          });
        });

        // Handle controller change (after skipWaiting)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Controlled by new service worker — page will reload from the update button click
        });

        // Periodic update check (every 60 minutes)
        const intervalId = setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000
        );

        return () => clearInterval(intervalId);
      } catch (error) {
        // Service worker registration failed — app functions without it
      }
    };

    register();

    return () => {
      if (updateBannerRef.current) {
        updateBannerRef.current.remove();
      }
    };
  }, [showUpdateBanner]);

  return null;
}
