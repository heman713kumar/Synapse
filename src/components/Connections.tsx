import React, { useState, useEffect } from 'react';
import { User, Page } from '../types';
// FIX: Changed mockApiService to backendApiService
import api from '../services/backendApiService';
import { EmptyState } from './EmptyState';
import { UsersIcon } from './icons';

interface ConnectionsProps {
    userId: string;
    setPage: (page: Page, id?: string) => void;
}

export const Connections: React.FC<ConnectionsProps> = ({ userId, setPage }) => {
    const [connections, setConnections] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // api is now backendApiService
        api.getUserById(userId).then(async user => {
            if (user) {
                const connectionData = await Promise.all(
                    user.connections.map(id => api.getUserById(id))
                );
                setConnections(connectionData.filter((c): c is User => c !== null));
            }
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to fetch connections:", err);
            setIsLoading(false);
        });
    }, [userId]);

    if (isLoading) return <div className="text-center p-8">Loading connections...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">My Connections</h1>
                {connections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {connections.map(user => (
                            <div key={user.userId} className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10 flex items-center space-x-4">
                                <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full" />
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                                    <p className="text-gray-400 truncate">{user.bio}</p>
                                    <button onClick={() => setPage('profile', user.userId)} className="mt-2 text-indigo-400 text-sm font-semibold hover:underline">
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <EmptyState
                        icon={UsersIcon}
                        title="No Connections Yet"
                        message="Build your network by connecting with innovators, creators, and collaborators."
                        ctaText="Find People to Connect With"
                        onCtaClick={() => setPage('explore')}
                    />
                )}
            </div>
        </div>
    );
};