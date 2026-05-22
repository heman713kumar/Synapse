import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface RecentItem {
  id: string;
  type: 'idea' | 'user';
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  viewedAt: string;
}

const MAX = 8;

export function useRecentlyViewed() {
  const [items, setItems] = useLocalStorage<RecentItem[]>('synapse-recently-viewed', []);

  const track = useCallback(
    (item: Omit<RecentItem, 'viewedAt'>) => {
      setItems((prev) => {
        const filtered = prev.filter((p) => !(p.id === item.id && p.type === item.type));
        return [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX);
      });
    },
    [setItems]
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  return { items, track, clear };
}
