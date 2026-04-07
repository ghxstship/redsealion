'use client';

import { useState, useEffect } from 'react';
import { IconLock, IconX } from '@/components/ui/Icons';
import Button from '@/components/ui/Button';

export function CookieBanner() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  // Load consent state on mount
  useEffect(() => {
    const consentState = localStorage.getItem('fd_cookie_consent');
    if (consentState) {
      setHasConsented(true);
    } else {
      setHasConsented(false);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('fd_cookie_consent', 'all');
    setHasConsented(true);
    // Here we would typically initialize analytics scripts
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('fd_cookie_consent', 'essential');
    setHasConsented(true);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('fd_cookie_consent', 'custom');
    setHasConsented(true);
    setShowPreferences(false);
  };

  // Do not render anything during SSR or if consent is already given
  if (hasConsented === null || hasConsented === true) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
        <div className="mx-auto max-w-5xl rounded-xl border border-border bg-white p-6 shadow-2xl pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <IconLock className="h-5 w-5 text-indigo-600" />
              We value your privacy
            </h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-3xl">
              We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking "Accept All", you agree to this, as outlined in our{' '}
              <a href="/privacy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Button variant="secondary" onClick={() => setShowPreferences(true)} className="w-full sm:w-auto">
              Manage Preferences
            </Button>
            <Button variant="secondary" onClick={handleRejectNonEssential} className="w-full sm:w-auto">
              Reject All
            </Button>
            <Button variant="primary" onClick={handleAcceptAll} className="w-full sm:w-auto">
              Accept All
            </Button>
          </div>
        </div>
      </div>

      {showPreferences && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-white shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-semibold text-foreground">Cookie Preferences</h3>
              <button onClick={() => setShowPreferences(false)} className="text-text-muted hover:text-foreground">
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Strictly Necessary Cookies</span>
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">Always Active</span>
                </div>
                <p className="text-sm text-text-secondary">These cookies are required for the website to function securely and cannot be switched off.</p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Analytics Cookies</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-sm text-text-secondary">Help us understand how users interact with our platform by collecting and reporting information anonymously.</p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Marketing & Tracking Cookies</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-sm text-text-secondary">Used by our advertising partners to build a profile of your interests and show you relevant adverts on other sites.</p>
              </div>
            </div>
            <div className="p-6 border-t border-border bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowPreferences(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
