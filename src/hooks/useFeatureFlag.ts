import { useLocalStorage } from './useLocalStorage';

/**
 * Lightweight client-side feature flags (override via localStorage).
 * For real A/B testing, swap the source with a remote provider.
 */
const DEFAULTS: Record<string, boolean> = {
  'ai-idea-coach': true,
  'reactions': true,
  'live-cursors': false,
  'voice-input': true,
  'pwa-install-prompt': true,
  'page-transitions': true,
  'idea-remix': true,
  'streak-counter': true,
  'recently-viewed': true,
  'shortcuts-overlay': true,
};

export function useFeatureFlag(name: keyof typeof DEFAULTS | string): boolean {
  const [overrides] = useLocalStorage<Record<string, boolean>>('synapse-flags', {});
  if (name in overrides) return overrides[name];
  return DEFAULTS[name] ?? false;
}
