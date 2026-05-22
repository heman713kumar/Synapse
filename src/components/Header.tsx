import React from 'react';
import { User, Page } from '../types';
import { NotificationBell } from './NotificationBell';
import {
  Plus, Sun, Moon, LogOut, Search, Settings as SettingsIcon, User as UserIcon,
  Compass, Network, BookMarked, TrendingUp, Bell, Trophy, Hash, Calendar, Target, Crown, Activity, DollarSign, GraduationCap, Code2,
  Briefcase, GitCompare, Map, Megaphone,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Tooltip } from './ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from './ui/DropdownMenu';
import { userName } from '../utils/format';

interface HeaderProps {
  currentUser: User | null;
  isGuest: boolean;
  setPage: (page: Page, id?: string) => void;
  setCurrentUser: (user: User | null) => void;
  onGuestAction: () => void;
  onNavigateToLogin: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isGuest,
  setPage,
  setCurrentUser,
  onGuestAction,
  onNavigateToLogin,
  theme,
  toggleTheme,
  onOpenPalette,
}) => {
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setPage('feed');
  };

  const handleNewIdeaClick = () => {
    if (isGuest) onGuestAction();
    else setPage('newIdea');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-strong border-b border-border">
      <div className="container max-w-7xl h-full flex items-center justify-between gap-2">
        {/* LOGO */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setPage('feed')}
            className="group flex items-center gap-2 focus-ring rounded-md"
            aria-label="Synapse home"
            data-tour="logo"
          >
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white font-bold text-lg shadow-glow-sm group-hover:shadow-glow transition-shadow">
              S
              <span className="absolute -inset-px rounded-xl bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            </span>
            <span className="hidden sm:inline text-xl font-bold tracking-tight text-gradient">Synapse</span>
          </button>
          <Badge variant="soft" size="sm" className="hidden md:inline-flex">Beta</Badge>
        </div>

        {/* GLOBAL SEARCH (palette trigger) */}
        {onOpenPalette && (
          <button
            onClick={onOpenPalette}
            data-tour="palette"
            className="hidden md:flex items-center gap-2 max-w-md flex-1 mx-4 h-9 px-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm focus-ring"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search ideas, people, commands…</span>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background/60 px-1.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
        )}

        {/* ACTIONS */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenPalette && (
            <Tooltip content="Search (⌘K)">
              <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onOpenPalette} aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}

          {/* New Idea */}
          <Tooltip content="Share a new idea">
            <Button onClick={handleNewIdeaClick} variant="gradient" size="sm" leftIcon={<Plus className="h-4 w-4" />} data-tour="new-idea">
              <span className="hidden sm:inline">New idea</span>
            </Button>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </Tooltip>

          {!currentUser ? (
            <Button variant="outline" size="sm" onClick={onNavigateToLogin}>Log in</Button>
          ) : (
            <>
              <span data-tour="notifications" className="inline-flex"><NotificationBell setPage={setPage} /></span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-tour="profile"
                    className="ml-0.5 rounded-full ring-offset-background transition-all focus-ring hover:ring-2 hover:ring-primary/40"
                    aria-label="Account menu"
                  >
                    <Avatar
                      src={currentUser.avatarUrl}
                      name={userName(currentUser)}
                      size="sm"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-2 py-2 flex items-center gap-3">
                    <Avatar src={currentUser.avatarUrl} name={userName(currentUser)} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{userName(currentUser)}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Browse</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPage('profile', currentUser.userId)}>
                    <UserIcon className="h-4 w-4" /> My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('explore')}>
                    <Compass className="h-4 w-4" /> Explore
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('trending')}>
                    <TrendingUp className="h-4 w-4" /> Trending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('connections')}>
                    <Network className="h-4 w-4" /> Connections
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('bookmarks')}>
                    <BookMarked className="h-4 w-4" /> Bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Community</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPage('spaces')}>
                    <Hash className="h-4 w-4" /> Spaces
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('events')}>
                    <Calendar className="h-4 w-4" /> Events &amp; AMAs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('leaderboard')}>
                    <Trophy className="h-4 w-4" /> Leaderboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('trendingTags')}>
                    <Hash className="h-4 w-4" /> Trending tags
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('jobs')}>
                    <Briefcase className="h-4 w-4" /> Jobs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('bounties')}>
                    <DollarSign className="h-4 w-4" /> Bounties
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('compare')}>
                    <GitCompare className="h-4 w-4" /> Compare ideas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Progress</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPage('quests')}>
                    <Target className="h-4 w-4" /> Quests &amp; streaks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('activity')}>
                    <Activity className="h-4 w-4" /> My activity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('investor')}>
                    <DollarSign className="h-4 w-4" /> Investor mode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('mentorship')}>
                    <GraduationCap className="h-4 w-4" /> Mentorship
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('developer')}>
                    <Code2 className="h-4 w-4" /> Developer (API & Webhooks)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('premium')}>
                    <Crown className="h-4 w-4" /> Upgrade to Pro
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>About</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPage('roadmap')}>
                    <Map className="h-4 w-4" /> Public roadmap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('changelog')}>
                    <Megaphone className="h-4 w-4" /> Changelog
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('status')}>
                    <Activity className="h-4 w-4" /> System status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPage('notifications')}>
                    <Bell className="h-4 w-4" /> Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('settings')}>
                    <SettingsIcon className="h-4 w-4" /> Settings
                    <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} destructive>
                    <LogOut className="h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
