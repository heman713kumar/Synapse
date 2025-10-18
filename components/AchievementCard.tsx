import React from 'react';
import { Achievement } from '../types';
import * as Icons from './icons';

interface AchievementCardProps {
    achievement: Achievement & { progress: number; unlockedAt: string | null };
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
    const isUnlocked = !!achievement.unlockedAt;
    const progressPercent = Math.min((achievement.progress / achievement.goal) * 100, 100);

    const IconComponent = Icons[achievement.icon as keyof typeof Icons] || Icons.TrophyIcon;

    return (
        <div className={`bg-[#1A1A24] p-6 rounded-2xl shadow-lg border ${isUnlocked ? 'border-yellow-400/30' : 'border-white/10'} flex flex-col items-center text-center transition-all duration-300`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isUnlocked ? 'bg-yellow-400/10' : 'bg-[#252532]'}`}>
                <IconComponent className={`w-10 h-10 ${isUnlocked ? 'text-yellow-400' : 'text-gray-400'}`} />
            </div>
            <h3 className={`font-bold text-lg ${isUnlocked ? 'text-white' : 'text-gray-300'}`}>{achievement.name}</h3>
            <p className="text-sm text-gray-400 mt-1 h-10">{achievement.description}</p>
            
            <div className="w-full mt-4">
                {isUnlocked ? (
                     <div className="text-center font-semibold text-yellow-400 bg-yellow-400/10 py-1.5 rounded-lg">
                        Unlocked on {new Date(achievement.unlockedAt!).toLocaleDateString()}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress} / {achievement.goal}</span>
                        </div>
                        <div className="w-full bg-[#252532] rounded-full h-2.5">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
