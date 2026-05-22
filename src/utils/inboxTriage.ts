/** Lightweight client-side triage: gives each conversation an intent label.
 *  Heuristic-only — no AI call needed. Swap with a server-side classifier later. */

export type TriageLabel = 'collab' | 'question' | 'networking' | 'spam' | 'message';

export interface TriageMeta {
  label: TriageLabel;
  emoji: string;
  color: string; // tailwind gradient classes
  text: string;
}

const KEYWORDS: Record<Exclude<TriageLabel, 'message'>, RegExp[]> = {
  collab: [/collaborat/i, /join (your|the) (team|idea|project)/i, /work together/i, /partner/i, /co-?found/i, /hiring/i, /co-?build/i],
  question: [/\?$/, /^how/i, /^what/i, /^why/i, /^could you/i, /^can you/i, /any tips/i, /advice/i, /question/i],
  networking: [/nice to (meet|connect)/i, /loved your/i, /great (idea|profile)/i, /coffee/i, /chat sometime/i, /follow/i, /lets connect/i, /huge fan/i],
  spam: [/click here/i, /\$\d{3,}/i, /free money/i, /crypto.{0,8}(invest|airdrop)/i, /buy now/i, /(http|www).+(http|www).+(http|www)/i, /^[A-Z\s!?.]{40,}$/],
};

export function triageMessage(text: string | undefined | null): TriageMeta {
  const t = (text ?? '').trim();
  if (!t) return defaultMeta('message');

  for (const [label, regexes] of Object.entries(KEYWORDS) as [Exclude<TriageLabel, 'message'>, RegExp[]][]) {
    if (regexes.some((r) => r.test(t))) return defaultMeta(label);
  }
  return defaultMeta('message');
}

function defaultMeta(label: TriageLabel): TriageMeta {
  switch (label) {
    case 'collab':     return { label, emoji: '🤝', color: 'from-emerald-500 to-teal-500',     text: 'Collab' };
    case 'question':   return { label, emoji: '❓', color: 'from-amber-500 to-orange-500',     text: 'Question' };
    case 'networking': return { label, emoji: '🌐', color: 'from-sky-500 to-blue-500',         text: 'Networking' };
    case 'spam':       return { label, emoji: '🚫', color: 'from-rose-500 to-red-500',         text: 'Spam' };
    case 'message':    return { label, emoji: '💬', color: 'from-indigo-500 to-violet-500',    text: 'Message' };
  }
}
