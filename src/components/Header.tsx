// C:\Users\hemant\Downloads\synapse\src\components\Header.tsx
import React from 'react';
import { User, Page } from '../types';
import { NotificationBell } from './NotificationBell';
// Ensure LogOutIcon is imported correctly now that it exists in icons.tsx
import { PlusIcon, SunIcon, MoonIcon, LogOutIcon } from './icons';

interface HeaderProps {
    currentUser: User | null;
    isGuest: boolean;
    setPage: (page: Page, id?: string) => void;
    setCurrentUser: (user: User | null) => void;
    onGuestAction: () => void;
    onNavigateToLogin: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, isGuest, setPage, setCurrentUser, onGuestAction, onNavigateToLogin, theme, toggleTheme }) => {
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setPage('feed'); // Navigate to feed after logout
        // Optionally, force reload if needed: window.location.reload();
    };

    const handleNewIdeaClick = () => {
        if (isGuest) {
            onGuestAction();
        } else {
            setPage('newIdea');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-white/60 dark:bg-[#0A0A0F]/60 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <button onClick={() => setPage('feed')} className="text-2xl font-bold text-gradient font-space-grotesk transition-transform hover:scale-105">
                            Synapse
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                         <button onClick={handleNewIdeaClick} className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transform transition-transform hover:-translate-y-0.5 active:scale-95">
                            <PlusIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">New Idea</span>
                        </button>

                        <button
                          onClick={toggleTheme}
                          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                          {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                        </button>

                        {isGuest || !currentUser ? (
                             <div className="flex items-center space-x-2">
                                <button onClick={onNavigateToLogin} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-md transition-colors">
                                    Log In
                                </button>
                                <button onClick={onNavigateToLogin} className="text-sm font-medium text-gray-800 dark:text-white bg-gray-500/10 dark:bg-white/10 hover:bg-gray-500/20 dark:hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors">
                                    Sign Up
                                </button>
                            </div>
                        ) : (
                           <>
                                <NotificationBell setPage={setPage} />
                                <div className="relative group">
                                    <button onClick={() => setPage('profile', currentUser.userId)} className="flex items-center transition-transform hover:scale-105" aria-label="View Profile">
                                         {/* --- FIX: Updated path for GitHub Pages subfolder --- */}
                                        <img className="h-8 w-8 rounded-full ring-2 ring-transparent group-hover:ring-indigo-500 transition-all object-cover" src={currentUser.avatarUrl || '/Synapse/default-avatar.png'} alt={currentUser.displayName || currentUser.username} />
                                    </button>
                                </div>
                                 <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors" aria-label="Logout">
                                     {/* Ensure LogOutIcon is used here */}
                                     <LogOutIcon className="w-5 h-5"/>
                                 </button>
                           </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};