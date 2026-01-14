import React from 'react';

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    message: string;
    ctaText?: string;
    onCtaClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, ctaText, onCtaClick }) => {
    return (
        <div className="bg-[#1A1A24]/70 backdrop-blur-md border border-dashed border-white/20 p-8 rounded-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-indigo-500/10 border-2 border-indigo-500/30 mb-4">
                <Icon className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-gray-400 mt-2 max-w-xs">{message}</p>
            {ctaText && onCtaClick && (
                <button
                    onClick={onCtaClick}
                    className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-opacity active:scale-95"
                >
                    {ctaText}
                </button>
            )}
        </div>
    );
};