import * as React from 'react';
import { cn } from '../../utils/cn';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

/**
 * Basic inline spinner — keep this lightweight: it appears inside buttons,
 * input adornments, and other tight spots. Don't add brand chrome here.
 */
export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-primary', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  BRANDED LOADER — shared internals used by FullPageSpinner +       */
/*  PageLoader. Pulsing hexagonal "neural network" with a central     */
/*  "S" mark + shimmer label + bouncing dots. Pure CSS so it runs     */
/*  even before the rest of the JS bundle has finished parsing.       */
/* ------------------------------------------------------------------ */

const HEX_NODES = [0, 60, 120, 180, 240, 300].map((deg, i) => {
  const r = 75;
  const rad = (deg * Math.PI) / 180;
  return {
    i,
    x: 100 + r * Math.cos(rad),
    y: 100 + r * Math.sin(rad),
    delay: i * 0.18,
  };
});

function BrandedLoaderStyles() {
  return (
    <style>{`
      @keyframes synapse-pulse {
        0%, 100% { transform: scale(1);    opacity: 0.55; }
        50%      { transform: scale(1.25); opacity: 1;    }
      }
      @keyframes synapse-orbit         { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
      @keyframes synapse-orbit-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg);   } }
      @keyframes synapse-fire {
        0%   { stroke-dashoffset: 100; opacity: 0; }
        35%  { opacity: 1; }
        100% { stroke-dashoffset: 0;   opacity: 0; }
      }
      @keyframes synapse-glow {
        0%, 100% { filter: drop-shadow(0 0 8px  rgba(168, 85, 247, 0.45)); }
        50%      { filter: drop-shadow(0 0 26px rgba(217, 70, 239, 0.85)); }
      }
      @keyframes synapse-float {
        0%, 100% { transform: translateY(0);    }
        50%      { transform: translateY(-6px); }
      }
      @keyframes synapse-fade {
        0%, 100% { opacity: 0.35; transform: scale(0.85); }
        50%      { opacity: 1;    transform: scale(1.15); }
      }
      @keyframes synapse-bar {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(400%);  }
      }
      @keyframes synapse-shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }

      .synapse-node      { transform-box: fill-box; transform-origin: center; animation: synapse-pulse 1.6s ease-in-out infinite; }
      .synapse-line      { stroke-dasharray: 100; animation: synapse-fire 1.6s ease-in-out infinite; }
      .synapse-orbit-cw  { animation: synapse-orbit         8s linear infinite; transform-origin: center; }
      .synapse-orbit-ccw { animation: synapse-orbit-reverse 12s linear infinite; transform-origin: center; }
      .synapse-orb       { animation: synapse-glow 2.4s ease-in-out infinite, synapse-float 4s ease-in-out infinite; }
      .synapse-dot       { animation: synapse-fade 1.2s ease-in-out infinite; }
      .synapse-bar-fill  { animation: synapse-bar 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      .synapse-label {
        background: linear-gradient(90deg, rgba(255,255,255,0.55) 25%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.55) 75%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
                background-clip: text;
        color: transparent;
        animation: synapse-shimmer 2.4s linear infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .synapse-node, .synapse-line, .synapse-orbit-cw, .synapse-orbit-ccw,
        .synapse-orb, .synapse-dot, .synapse-bar-fill, .synapse-label {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function BrandedLoaderInner({ label }: { label?: string }) {
  return (
    <div className="relative w-full h-full min-h-[60vh] flex items-center justify-center overflow-hidden">
      <BrandedLoaderStyles />

      {/* Soft background flourishes — match the Login page palette so the
          loading screen feels like part of the same world. */}
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4  h-72 w-72 rounded-full bg-indigo-500/20  blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="synapse-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#6366f1" />
                <stop offset="50%"  stopColor="#a855f7" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
              <radialGradient id="synapse-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#f0abfc" stopOpacity="1"    />
                <stop offset="60%"  stopColor="#a855f7" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4"  />
              </radialGradient>
            </defs>

            <circle className="synapse-orbit-cw"  cx="100" cy="100" r="90"
              fill="none" stroke="url(#synapse-grad)" strokeWidth="1.5"
              strokeDasharray="10 10" opacity="0.4" />
            <circle className="synapse-orbit-ccw" cx="100" cy="100" r="55"
              fill="none" stroke="url(#synapse-grad)" strokeWidth="1"
              strokeDasharray="4 6" opacity="0.55" />

            {HEX_NODES.map((n) => (
              <line key={`l-${n.i}`} x1="100" y1="100" x2={n.x} y2={n.y}
                stroke="url(#synapse-grad)" strokeWidth="1.5"
                className="synapse-line" style={{ animationDelay: `${n.delay}s` }} />
            ))}
            {HEX_NODES.map((n) => (
              <circle key={`n-${n.i}`} cx={n.x} cy={n.y} r="7"
                fill="url(#synapse-grad)" className="synapse-node"
                style={{ animationDelay: `${n.delay}s` }} />
            ))}

            <circle cx="100" cy="100" r="22" fill="url(#synapse-core)" className="synapse-orb" />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="synapse-orb text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] font-space-grotesk">
              S
            </span>
          </div>
        </div>

        {label && (
          <div className="flex flex-col items-center gap-3">
            <p className="synapse-label text-base font-semibold tracking-wide font-space-grotesk">
              {label}
            </p>

            <div className="relative h-1 w-48 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="synapse-bar-fill absolute inset-y-0 -left-1/2 w-1/2 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, #a855f7 50%, transparent)' }}
              />
            </div>

            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="synapse-dot h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Full-screen branded loader.
 *
 * Used for:
 *   1. App boot (App.tsx, while isBooting === true)
 *   2. Suspense fallback for every lazy-loaded page route
 *
 * Fills the viewport entirely with the brand background.
 */
export function FullPageSpinner({ label = 'Loading Synapse…' }: { label?: string }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <BrandedLoaderInner label={label} />
    </div>
  );
}

/**
 * In-page branded loader.
 *
 * Used inside route components (Feed, Explore, …) that want the loader to
 * stay visible until their own data + images are ready. Sits inside the
 * page chrome (Header + BottomNav remain visible around it) rather than
 * covering the whole viewport.
 */
export function PageLoader({
  label = 'Loading…',
  minHeight = '70vh',
}: {
  label?: string;
  minHeight?: string;
}) {
  return (
    <div className="w-full flex" style={{ minHeight }}>
      <BrandedLoaderInner label={label} />
    </div>
  );
}
