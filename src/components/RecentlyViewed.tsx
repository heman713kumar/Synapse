import React from 'react';
import { Clock, X } from 'lucide-react';
import { Page } from '../types';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { Avatar } from './ui/Avatar';
import { Card, CardContent } from './ui/Card';
import { Tooltip } from './ui/Tooltip';
import { timeAgo } from '../utils/format';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

export const RecentlyViewed: React.FC<Props> = ({ setPage }) => {
  const { items, clear } = useRecentlyViewed();

  if (items.length === 0) return null;

  const go = (item: typeof items[number]) => {
    if (item.type === 'idea') setPage('ideaDetail', item.id);
    if (item.type === 'user') setPage('profile', item.id);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recently viewed</h3>
          </div>
          <Tooltip content="Clear history">
            <button onClick={clear} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="h-3 w-3" />
            </button>
          </Tooltip>
        </div>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <button
                onClick={() => go(item)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition-colors text-left"
              >
                {item.type === 'user' ? (
                  <Avatar src={item.avatarUrl} name={item.title} size="xs" />
                ) : (
                  <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">💡</span>
                )}
                <span className="text-xs truncate flex-1">{item.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(item.viewedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
