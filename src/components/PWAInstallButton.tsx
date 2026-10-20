import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold transition-all active:scale-95 shadow-sm"
        aria-label="Install Clock PWA"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] text-xs font-medium transition-all active:scale-95"
          aria-label="Install on iOS device"
        >
          <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--modal-bg)] border border-[var(--border)] p-6 shadow-2xl text-[var(--text)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[var(--text)]">Install on iPhone & iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface-secondary)] transition"
                  aria-label="Close guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold shrink-0">1</span>
                  <p>Tap the <strong className="text-[var(--text)]">Share</strong> button in the Safari bottom toolbar.</p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold shrink-0">2</span>
                  <p>Scroll down and select <strong className="text-[var(--text)]">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold shrink-0">3</span>
                  <p>Launch <strong className="text-[var(--text)]">Clock</strong> directly from your home screen with zero browser bars!</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-sm transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
