import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Page, User } from '../types';
import {
    Home, Compass, MessageSquare, Bell, User as UserIcon, Plus, ChevronUp,
    HelpCircle, NotebookPen, Layers, Users as UsersIcon, Mail, BookmarkPlus,
    History, Trophy, Crown,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface BottomNavBarProps {
    activePage: Page;
    setPage: (page: Page, id?: string) => void;
    currentUser: User | null;
    isGuest: boolean;
    onGuestAction: () => void;
}

const NavItem: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isDisabled?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, isDisabled }) => (
    <button
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
            'relative flex flex-col items-center justify-center w-full h-full transition-all focus-ring rounded-md',
            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            isDisabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-current={isActive ? 'page' : undefined}
    >
        {isActive && (
            <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
        )}
        <Icon className={cn('w-5 h-5 mb-0.5 transition-transform', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
        <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{label}</span>
    </button>
);

interface MoreEntry { icon: React.ElementType; label: string; page: Page; guestOk?: boolean; }

const MORE_ENTRIES: MoreEntry[] = [
    { icon: Layers,       label: 'Browse by stage', page: 'browseByStage', guestOk: true },
    { icon: Crown,        label: 'Curator picks',   page: 'curatorPicks',  guestOk: true },
    { icon: UsersIcon,    label: 'Co-founder match', page: 'coFounderMatch' },
    { icon: Mail,         label: 'Weekly digest',   page: 'digest' },
    { icon: Trophy,       label: 'Wall of fame',    page: 'wallOfFame',    guestOk: true },
    { icon: NotebookPen,  label: 'My notes',        page: 'notes',         guestOk: true },
    { icon: BookmarkPlus, label: 'Saved searches',  page: 'savedSearches', guestOk: true },
    { icon: History,      label: 'Search history',  page: 'searchHistory', guestOk: true },
    { icon: HelpCircle,   label: 'Help center',     page: 'help',          guestOk: true },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activePage, setPage, currentUser, isGuest, onGuestAction }) => {
    const [sheetOpen, setSheetOpen] = useState(false);
    const handleNewIdea = () => (isGuest || !currentUser ? onGuestAction() : setPage('newIdea'));

    const onMoreSelect = (e: MoreEntry) => {
        if (!e.guestOk && (isGuest || !currentUser)) { onGuestAction(); setSheetOpen(false); return; }
        setSheetOpen(false);
        setPage(e.page);
    };

    return (
        <>
            <footer className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border">
                {/* "More" handle — sits half-above the nav so it always shows */}
                <button
                    onClick={() => setSheetOpen(true)}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 h-6 px-3 rounded-full bg-background border border-border shadow-md inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Open more navigation"
                >
                    <ChevronUp className="h-3 w-3" />
                    More
                </button>
                <div className="container max-w-md mx-auto px-2 relative">
                    <div className="grid grid-cols-5 items-center h-16 gap-1">
                        <NavItem
                            icon={Home}
                            label="Home"
                            isActive={activePage === 'feed'}
                            onClick={() => setPage('feed')}
                        />
                        <NavItem
                            icon={Compass}
                            label="Explore"
                            isActive={activePage === 'explore' || activePage === 'trending' || activePage === 'search'}
                            onClick={() => setPage('explore')}
                        />
                        {/* Center floating Plus */}
                        <div className="flex items-center justify-center">
                            <button
                                onClick={handleNewIdea}
                                className="relative -mt-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-glow flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus-ring"
                                aria-label="Create new idea"
                            >
                                <Plus className="w-6 h-6" strokeWidth={2.5} />
                            </button>
                        </div>
                        <NavItem
                            icon={MessageSquare}
                            label="Inbox"
                            isActive={activePage === 'inbox' || activePage === 'chat'}
                            onClick={isGuest ? onGuestAction : () => setPage('inbox')}
                        />
                        <NavItem
                            icon={currentUser ? UserIcon : Bell}
                            label={currentUser ? 'Me' : 'Alerts'}
                            isActive={activePage === 'profile' || activePage === 'notifications'}
                            onClick={
                                isGuest || !currentUser
                                    ? onGuestAction
                                    : () => setPage('profile', currentUser.userId)
                            }
                        />
                    </div>
                </div>
            </footer>

            {/* More sheet */}
            <AnimatePresence>
                {sheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSheetOpen(false)}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t border-border shadow-2xl pb-safe"
                        >
                            <div className="mx-auto h-1 w-10 rounded-full bg-border mt-2 mb-3" />
                            <div className="px-4 pb-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">More</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {MORE_ENTRIES.map((e) => {
                                        const Icon = e.icon;
                                        const isActive = activePage === e.page;
                                        return (
                                            <button
                                                key={e.page}
                                                onClick={() => onMoreSelect(e)}
                                                className={cn(
                                                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all',
                                                    isActive ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:border-primary/40',
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span className="text-[11px] font-medium text-center leading-tight">{e.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
