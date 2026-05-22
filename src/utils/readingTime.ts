/** Calculate estimated reading time for text (200 wpm) */
export function readingTime(text: string): { minutes: number; words: number; label: string } {
  if (!text) return { minutes: 0, words: 0, label: 'Quick read' };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return {
    minutes,
    words,
    label: minutes === 1 ? '1 min read' : `${minutes} min read`,
  };
}
