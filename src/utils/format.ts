import { formatDistanceToNow, format, isToday, isYesterday, differenceInDays } from 'date-fns';

/** "2h ago", "3 days ago", "just now" */
export function timeAgo(date: string | Date | undefined | null): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const secs = (Date.now() - d.getTime()) / 1000;
    if (secs < 30) return 'just now';
    if (secs < 60) return `${Math.floor(secs)}s ago`;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '';
  }
}

/** Smart timestamp: "10:30 AM" today, "Yesterday", "Mon" within week, else "Mar 12" */
export function smartTime(date: string | Date | undefined | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  if (differenceInDays(new Date(), d) < 7) return format(d, 'EEE');
  return format(d, 'MMM d');
}

/** Abbreviated number: 1.2k, 4.5M */
export function compactNumber(n: number | undefined | null): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000_000_000).toFixed(1)}B`;
}

/** Build initials from a display name */
export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

/** Resolve a user's display name across legacy fields */
export function userName(user: { displayName?: string; name?: string; username?: string; email?: string } | null | undefined): string {
  if (!user) return 'Unknown';
  return user.displayName || user.name || user.username || user.email?.split('@')[0] || 'Unknown';
}

/** Truncate to N chars, append … */
export function truncate(text: string | undefined | null, n: number): string {
  if (!text) return '';
  return text.length > n ? `${text.slice(0, n - 1)}…` : text;
}

/** Plural helper: pluralize('idea', 1) → '1 idea', pluralize('idea', 2) → '2 ideas' */
export function pluralize(word: string, count: number, plural?: string): string {
  const text = count === 1 ? word : (plural ?? `${word}s`);
  return `${compactNumber(count)} ${text}`;
}
