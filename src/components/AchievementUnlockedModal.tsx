import React from 'react';
import { AchievementId } from '../types';
import { ACHIEVEMENTS } from '../constants';
import * as Icons from './icons';
import { XIcon } from './icons';

interface AchievementUnlockedModalProps {
    achievementId: AchievementId;
    onClose: () => void;
    onShare: () => void;
}

export const AchievementUnlockedModal: React.FC<AchievementUnlockedModalProps> = ({ achievementId, onClose, onShare }) => {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;

    const IconComponent = Icons[achievement.icon as keyof typeof Icons] || Icons.TrophyIcon;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-yellow-400/50 max-w-md w-full p-8 relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <h2 className="text-xl font-bold text-yellow-300 mb-2">Achievement Unlocked!</h2>

                <div className="flex flex-col items-center my-6">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center bg-yellow-400/10 border-2 border-yellow-400/30">
                        <IconComponent className="w-12 h-12 text-yellow-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mt-4">{achievement.name}</h3>
                    <p className="text-gray-400 mt-1">{achievement.description}</p>
                </div>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-white bg-[#374151] hover:bg-[#4b5563]"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={onShare}
                        className="px-6 py-2 rounded-lg text-white shadow-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
                    >
                        Share to Feed
                    </button>
                </div>
            </div>
        </div>
    );
};