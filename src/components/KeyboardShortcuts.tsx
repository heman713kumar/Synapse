import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Badge } from './ui/Badge';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SECTIONS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'Global',
    items: [
      { keys: ['⌘', 'K'], label: 'Open command palette' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['⌘', '/'], label: 'Toggle theme' },
      { keys: ['Esc'], label: 'Close dialogs / cancel' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { keys: ['G', 'F'], label: 'Go to Feed' },
      { keys: ['G', 'E'], label: 'Go to Explore' },
      { keys: ['G', 'P'], label: 'Go to Profile' },
      { keys: ['G', 'I'], label: 'Go to Inbox' },
      { keys: ['G', 'N'], label: 'Go to Notifications' },
    ],
  },
  {
    title: 'Create',
    items: [
      { keys: ['N'], label: 'New idea' },
      { keys: ['/'], label: 'Focus search' },
    ],
  },
  {
    title: 'On an idea',
    items: [
      { keys: ['L'], label: 'Like' },
      { keys: ['B'], label: 'Bookmark' },
      { keys: ['C'], label: 'Comment' },
      { keys: ['S'], label: 'Share' },
    ],
  },
];

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-semibold text-foreground shadow-sm">
    {children}
  </kbd>
);

export const KeyboardShortcuts: React.FC<Props> = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <Badge variant="soft" size="sm">?</Badge>
        </div>
        <DialogDescription>Press <Kbd>?</Kbd> anytime to bring this back.</DialogDescription>
      </DialogHeader>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">{section.title}</h3>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/85">{item.label}</span>
                  <span className="flex items-center gap-1">
                    {item.keys.map((k, i) => (
                      <React.Fragment key={`${k}-${i}`}>
                        {i > 0 && <span className="text-muted-foreground text-xs">then</span>}
                        <Kbd>{k}</Kbd>
                      </React.Fragment>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
