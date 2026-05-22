import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Check, Settings as SettingsIcon, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { Label } from './ui/Label';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ConsentState {
  decidedAt: string | null;
  essential: true;          // always on
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT: ConsentState = {
  decidedAt: null,
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
};

export const CookieConsent: React.FC = () => {
  const [state, setState] = useLocalStorage<ConsentState>('synapse-cookie-consent', DEFAULT);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Show after 1s if no decision yet
  useEffect(() => {
    if (!state.decidedAt) {
      const t = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, [state.decidedAt]);

  const acceptAll = () => {
    setState({ ...state, decidedAt: new Date().toISOString(), functional: true, analytics: true, marketing: true });
    setOpen(false);
  };
  const rejectAll = () => {
    setState({ ...state, decidedAt: new Date().toISOString(), functional: false, analytics: false, marketing: false });
    setOpen(false);
  };
  const saveSettings = () => {
    setState({ ...state, decidedAt: new Date().toISOString() });
    setOpen(false);
    setShowSettings(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-4 bottom-4 z-[60] max-w-2xl mx-auto"
          role="dialog"
          aria-labelledby="cookie-title"
        >
          <div className="surface p-5 shadow-2xl shadow-primary/10 border-primary/30">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="cookie-title" className="font-semibold">We use cookies</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Essential cookies keep Synapse running. Optional cookies help us improve the product and show you the right content.
                </p>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2 overflow-hidden"
                    >
                      <ConsentRow label="Essential" desc="Login, security, basic features. Cannot be disabled." checked locked />
                      <ConsentRow label="Functional" desc="Remembers your theme, draft autosave, recently viewed." checked={state.functional} onChange={(c) => setState({ ...state, functional: c })} />
                      <ConsentRow label="Analytics" desc="Anonymous usage data so we know what to improve." checked={state.analytics} onChange={(c) => setState({ ...state, analytics: c })} />
                      <ConsentRow label="Marketing" desc="Personalized weekly digest emails + relevant suggestions." checked={state.marketing} onChange={(c) => setState({ ...state, marketing: c })} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {!showSettings ? (
                    <>
                      <Button variant="gradient" leftIcon={<Check className="h-4 w-4" />} onClick={acceptAll}>Accept all</Button>
                      <Button variant="outline" onClick={rejectAll}>Reject non-essential</Button>
                      <Button variant="ghost" leftIcon={<SettingsIcon className="h-4 w-4" />} onClick={() => setShowSettings(true)}>
                        Customize
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="gradient" onClick={saveSettings}>Save preferences</Button>
                      <Button variant="ghost" onClick={() => setShowSettings(false)}>Back</Button>
                    </>
                  )}
                </div>
              </div>
              <button onClick={rejectAll} aria-label="Reject all" className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function ConsentRow({ label, desc, checked, onChange, locked }: { label: string; desc: string; checked: boolean; onChange?: (c: boolean) => void; locked?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 p-2 rounded-lg bg-secondary/30">
      <div className="min-w-0">
        <Label className="cursor-pointer text-sm">{label}{locked && <span className="ml-1 text-[10px] uppercase text-muted-foreground">Required</span>}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={(c) => !locked && onChange?.(c)} disabled={locked} />
    </div>
  );
}
