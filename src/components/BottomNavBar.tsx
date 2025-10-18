import React from 'react';
import { Page, User } from '../types';
import { HomeIcon, CompassIcon, MessageSquareIcon, BellIcon, UsersIcon } from './icons';

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
}> = ({ icon: Icon, label, isActive, onClick, isDisabled }) => {
    const activeClass = isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400';
    const disabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-500 dark:hover:text-indigo-400';
    return (
        <button onClick={onClick} disabled={isDisabled} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all duration-200 transform ${isActive ? 'scale-110' : ''} ${activeClass} ${disabledClass}`}>
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activePage, setPage, currentUser, isGuest, onGuestAction }) => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/60 dark:bg-[#0A0A0F]/60 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-around items-center h-16">
                    <NavItem
                        icon={HomeIcon}
                        label="Home"
                        isActive={activePage === 'feed'}
                        onClick={() => setPage('feed')}
                    />
                    <NavItem
                        icon={CompassIcon}
                        label="Explore"
                        isActive={activePage === 'explore'}
                        onClick={() => setPage('explore')}
                    />
                    <NavItem
                        icon={MessageSquareIcon}
                        label="Messages"
                        isActive={activePage === 'inbox' || activePage === 'chat'}
                        onClick={isGuest ? onGuestAction : () => setPage('inbox')}
                    />
                    <NavItem
                        icon={BellIcon}
                        label="Notifications"
                        isActive={activePage === 'notifications'}
                        onClick={isGuest ? onGuestAction : () => setPage('notifications')}
                    />
                    <NavItem
                        icon={UsersIcon}
                        label="Profile"
                        isActive={activePage === 'profile'}
                        onClick={isGuest ? onGuestAction : () => setPage('profile', currentUser!.userId)}
                    />
                </div>
            </div>
        </footer>
    );
};