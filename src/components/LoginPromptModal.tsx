
import React from 'react';
import { XIcon, UsersIcon } from './icons';

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToLogin: () => void;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose, onNavigateToLogin }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-sm w-full p-8 relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-indigo-500/10 border-2 border-indigo-500/30 mx-auto">
                    <UsersIcon className="w-8 h-8 text-indigo-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mt-4">Join the Conversation</h2>
                <p className="text-gray-400 my-4">Sign up or log in to like, comment, collaborate, and bring your ideas to life.</p>
                
                <button
                    onClick={onNavigateToLogin}
                    className="w-full mt-4 px-6 py-3 rounded-lg text-white font-semibold shadow-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-opacity"
                >
                    Sign Up / Log In
                </button>
            </div>
        </div>
    );
};
