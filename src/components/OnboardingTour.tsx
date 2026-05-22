import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TourStep {
  selector: string; // CSS selector to highlight (best-effort; falls back to centered)
  title: string;
  body: string;
  align?: 'top' | 'bottom' | 'center';
}

const STEPS: TourStep[] = [
  { selector: '[data-tour="logo"]', title: 'Welcome to Synapse', body: 'A place where ideas meet the people to build them. Let me show you around in 30 seconds.', align: 'bottom' },
  { selector: '[data-tour="palette"]', title: 'Command palette', body: 'Press ⌘K (or Ctrl+K) anytime to jump anywhere — search ideas, switch theme, log out.', align: 'bottom' },
  { selector: '[data-tour="new-idea"]', title: 'Share your spark', body: 'Click here to start a guided wizard. AI helps you refine your pitch and find the right tags.', align: 'bottom' },
  { selector: '[data-tour="notifications"]', title: 'Stay in the loop', body: 'Reactions, comments, collaboration requests, achievements — all show up here.', align: 'bottom' },
  { selector: '[data-tour="profile"]', title: 'Your home base', body: 'Open your profile from the avatar menu. Settings, achievements, and your stats live there.', align: 'bottom' },
];

interface Props {
  /** Whether the user is authenticated — only show tour for logged in users */
  active: boolean;
}

export const OnboardingTour: React.FC<Props> = ({ active }) => {
  const [completed, setCompleted] = useLocalStorage<boolean>('synapse-tour-done', false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // Show 1500ms after login
  useEffect(() => {
    if (active && !completed) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, [active, completed]);

  // Track target rect for highlight
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = document.querySelector(STEPS[step].selector);
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, step]);

  const skip = () => { setCompleted(true); setOpen(false); };
  const next = () => {
    if (step >= STEPS.length - 1) { skip(); return; }
    setStep(step + 1);
  };

  if (!open) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] pointer-events-none"
      >
        {/* Dim overlay with cutout for highlighted element */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={skip}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.x - 8}
                  y={rect.y - 8}
                  width={rect.width + 16}
                  height={rect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" />
        </svg>

        {/* Highlight ring */}
        {rect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background pointer-events-none"
            style={{ left: rect.x - 8, top: rect.y - 8, width: rect.width + 16, height: rect.height + 16 }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          ref={tipRef}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 pointer-events-auto"
          style={
            rect && current.align !== 'center'
              ? current.align === 'top'
                ? { left: Math.min(window.innerWidth - 340, Math.max(16, rect.x)), top: Math.max(16, rect.y - 180) }
                : { left: Math.min(window.innerWidth - 340, Math.max(16, rect.x)), top: rect.y + rect.height + 16 }
              : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
          }
        >
          <div className="surface w-80 p-5 shadow-2xl border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="gradient" size="sm">
                <Sparkles className="h-3 w-3" /> Tour
              </Badge>
              <button onClick={skip} aria-label="Skip tour" className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="font-bold text-base tracking-tight">{current.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{current.body}</p>

            {/* Step dots */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'bg-primary w-6' : 'bg-border w-1.5'}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{step + 1}/{STEPS.length}</span>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={skip}>Skip</Button>
              <Button variant="gradient" size="sm" onClick={next} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                {isLast ? 'Got it' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
