import React from 'react';
import { Page, User } from '../types';
import { Home, Compass, MessageSquare, Bell, User as UserIcon, Plus } from 'lucide-react';
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

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activePage, setPage, currentUser, isGuest, onGuestAction }) => {
    const handleNewIdea = () => (isGuest || !currentUser ? onGuestAction() : setPage('newIdea'));

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border">
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
    );
};
