import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from './ui/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'synapse-pwa-dismissed';
const SHOW_AFTER_MS = 30_000; // wait 30s before nudging

export const PWAInstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissedAt, setDismissedAt] = useLocalStorage<number | null>(DISMISSED_KEY, null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);

      // Don't show again for 14 days after dismissal
      if (dismissedAt && Date.now() - dismissedAt < 14 * 24 * 3600 * 1000) return;

      setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissedAt]);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
      setDeferred(null);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissedAt(Date.now());
  };

  return (
    <AnimatePresence>
      {visible && deferred && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100%-2rem)] surface p-4 shadow-2xl shadow-primary/20 border-primary/30"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0 shadow-glow-sm">
              <Download className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Install Synapse</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get the app on your home screen — faster, offline-ready, push notifications.</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="gradient" onClick={handleInstall}>Install</Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>Not now</Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
