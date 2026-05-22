// Very lightweight client-side word filter — purely a UX guard rail.
// The real moderation lives server-side; this just nudges users before they hit submit.

const BLOCK_WORDS = [
  // Hate / slurs (placeholders — extend as needed)
  'kill yourself',
  'kys',
  // Spam patterns
  'click here to win',
  'free money',
  'work from home guaranteed',
];

// Words that warrant a soft warning but allow submission
const SOFT_WARN_WORDS = [
  'urgent', 'asap', 'limited time', 'act now',
];

const URL_REGEX = /https?:\/\/\S+/gi;
const REPEATED_CHARS_REGEX = /(.)\1{4,}/i; // aaaaa, !!!!!, etc.
const ALL_CAPS_REGEX = /^[\s!?.A-Z0-9]{15,}$/;

export type SafetyLevel = 'ok' | 'warn' | 'block';

export interface SafetyResult {
  level: SafetyLevel;
  reasons: string[];
}

export function checkContent(text: string): SafetyResult {
  const reasons: string[] = [];
  let level: SafetyLevel = 'ok';
  if (!text || !text.trim()) return { level, reasons };

  const lower = text.toLowerCase();

  for (const word of BLOCK_WORDS) {
    if (lower.includes(word)) {
      reasons.push(`Contains disallowed phrase: "${word}"`);
      level = 'block';
    }
  }

  for (const word of SOFT_WARN_WORDS) {
    if (lower.includes(word)) {
      reasons.push(`Spammy phrase detected: "${word}"`);
      if (level === 'ok') level = 'warn';
    }
  }

  // Too many links?
  const links = text.match(URL_REGEX) ?? [];
  if (links.length >= 3) {
    reasons.push(`${links.length} URLs included — looks promotional`);
    if (level === 'ok') level = 'warn';
  }

  // SHOUTY
  if (ALL_CAPS_REGEX.test(text.trim())) {
    reasons.push('Text is all caps — softer tone reads better');
    if (level === 'ok') level = 'warn';
  }

  // Excessive repetition (aaaaa, !!!!!!)
  if (REPEATED_CHARS_REGEX.test(text)) {
    reasons.push('Repeated characters detected');
    if (level === 'ok') level = 'warn';
  }

  return { level, reasons };
}
