import * as React from 'react';
import { Command } from 'cmdk';
import { Dialog, DialogPortal, DialogOverlay } from './ui/Dialog';
import { Page } from '../types';
import {
  Search, Home, Compass, MessageSquare, Bell, BookMarked, User as UserIcon,
  Plus, Settings, LogOut, Moon, Sun, Sparkles, TrendingUp, Network, Inbox as InboxIcon,
  Trophy, Hash, Calendar, Crown, DollarSign, Activity, Target, GraduationCap, Code2,
  Briefcase, GitCompare, Map, Megaphone, BarChart3,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../utils/cn';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (page: Page, id?: string) => void;
  onLogout?: () => void;
  isAuthenticated: boolean;
}

export function CommandPalette({ open, onOpenChange, onNavigate, onLogout, isAuthenticated }: CommandPaletteProps) {
  const { resolvedTheme, toggle } = useTheme();
  const [query, setQuery] = React.useState('');

  // Keyboard shortcut: Cmd/Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => () => {
    onOpenChange(false);
    setQuery('');
    setTimeout(fn, 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-[20%] z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl',
            'data-[state=open]:animate-scale-in'
          )}
        >
          <DialogPrimitive.Title className="sr-only">Command Palette</DialogPrimitive.Title>
          <Command className="flex flex-col" loop>
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Type a command or search…"
                className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
            <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground">
                <Item icon={<Home className="h-4 w-4" />} label="Go to Feed" shortcut="G F" onSelect={run(() => onNavigate('feed'))} />
                <Item icon={<Compass className="h-4 w-4" />} label="Explore ideas" shortcut="G E" onSelect={run(() => onNavigate('explore'))} />
                <Item icon={<Hash className="h-4 w-4" />} label="Spaces" onSelect={run(() => onNavigate('spaces'))} />
                <Item icon={<Calendar className="h-4 w-4" />} label="Events &amp; AMAs" onSelect={run(() => onNavigate('events'))} />
                <Item icon={<TrendingUp className="h-4 w-4" />} label="Trending" onSelect={run(() => onNavigate('trending'))} />
                <Item icon={<Hash className="h-4 w-4" />} label="Trending tags" onSelect={run(() => onNavigate('trendingTags'))} />
                <Item icon={<Trophy className="h-4 w-4" />} label="Leaderboard" onSelect={run(() => onNavigate('leaderboard'))} />
                <Item icon={<Briefcase className="h-4 w-4" />} label="Jobs" onSelect={run(() => onNavigate('jobs'))} />
                <Item icon={<DollarSign className="h-4 w-4" />} label="Bounties" onSelect={run(() => onNavigate('bounties'))} />
                <Item icon={<GitCompare className="h-4 w-4" />} label="Compare ideas" onSelect={run(() => onNavigate('compare'))} />
                <Item icon={<Search className="h-4 w-4" />} label="Advanced search" onSelect={run(() => onNavigate('search'))} />
                {isAuthenticated && (
                  <>
                    <Item icon={<InboxIcon className="h-4 w-4" />} label="Inbox" onSelect={run(() => onNavigate('inbox'))} />
                    <Item icon={<Bell className="h-4 w-4" />} label="Notifications" onSelect={run(() => onNavigate('notifications'))} />
                    <Item icon={<BookMarked className="h-4 w-4" />} label="Bookmarks" onSelect={run(() => onNavigate('bookmarks'))} />
                    <Item icon={<Network className="h-4 w-4" />} label="Connections" onSelect={run(() => onNavigate('connections'))} />
                    <Item icon={<Target className="h-4 w-4" />} label="Quests &amp; streaks" onSelect={run(() => onNavigate('quests'))} />
                    <Item icon={<Activity className="h-4 w-4" />} label="My activity" onSelect={run(() => onNavigate('activity'))} />
                    <Item icon={<UserIcon className="h-4 w-4" />} label="My profile" onSelect={run(() => onNavigate('profile'))} />
                    <Item icon={<DollarSign className="h-4 w-4" />} label="Investor mode" onSelect={run(() => onNavigate('investor'))} />
                    <Item icon={<GraduationCap className="h-4 w-4" />} label="Mentorship & Office Hours" onSelect={run(() => onNavigate('mentorship'))} />
                    <Item icon={<Code2 className="h-4 w-4" />} label="API keys & Webhooks" onSelect={run(() => onNavigate('developer'))} />
                  </>
                )}
                <Item icon={<Crown className="h-4 w-4" />} label="Upgrade to Pro" onSelect={run(() => onNavigate('premium'))} />
                <Item icon={<Map className="h-4 w-4" />} label="Public roadmap" onSelect={run(() => onNavigate('roadmap'))} />
                <Item icon={<Megaphone className="h-4 w-4" />} label="Changelog" onSelect={run(() => onNavigate('changelog'))} />
                <Item icon={<Activity className="h-4 w-4" />} label="System status" onSelect={run(() => onNavigate('status'))} />
                <Item icon={<BarChart3 className="h-4 w-4" />} label="Public stats" onSelect={run(() => onNavigate('stats'))} />
              </Command.Group>

              {isAuthenticated && (
                <Command.Group heading="Create" className="mt-2 px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground">
                  <Item icon={<Plus className="h-4 w-4" />} label="New idea" shortcut="N" onSelect={run(() => onNavigate('newIdea'))} />
                  <Item icon={<Sparkles className="h-4 w-4" />} label="AI idea coach" onSelect={run(() => onNavigate('newIdea'))} />
                  <Item icon={<MessageSquare className="h-4 w-4" />} label="Start a chat" onSelect={run(() => onNavigate('inbox'))} />
                </Command.Group>
              )}

              <Command.Group heading="Preferences" className="mt-2 px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground">
                <Item
                  icon={resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                  onSelect={run(toggle)}
                />
                {isAuthenticated && (
                  <Item icon={<Settings className="h-4 w-4" />} label="Open settings" onSelect={run(() => onNavigate('settings'))} />
                )}
                {isAuthenticated && onLogout && (
                  <Item icon={<LogOut className="h-4 w-4" />} label="Log out" destructive onSelect={run(onLogout)} />
                )}
              </Command.Group>
            </Command.List>

            <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd> navigate
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">⌘ K</kbd> toggle
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function Item({
  icon,
  label,
  shortcut,
  destructive,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  destructive?: boolean;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors select-none',
        'data-[selected=true]:bg-secondary aria-selected:bg-secondary',
        destructive && 'text-destructive data-[selected=true]:bg-destructive/10'
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
