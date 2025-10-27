import React, { useState, useEffect } from 'react';
import { User, Page, NotificationSettings as NotificationSettingsType, NotificationChannel } from '../types';
import api from '../services/backendApiService';

// --- ADD THESE DEFAULTS ---
const DEFAULT_DND_SETTINGS: NonNullable<NotificationSettingsType['doNotDisturb']> = {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
};

// Ensure this matches your `types.ts` definition EXACTLY
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsType = {
    collaborationRequests: ['inApp'],
    collaborationUpdates: ['inApp'],
    commentsOnMyIdeas: ['inApp'],
    feedbackOnMyIdeas: ['inApp'],
    newConnections: ['inApp'],
    achievementUnlocks: ['inApp'],
    directMessages: ['inApp'],
    messageReactions: ['inApp'],
    doNotDisturb: DEFAULT_DND_SETTINGS,
};
// --- END OF DEFAULTS ---


interface NotificationSettingsProps {
    currentUser: User;
    setCurrentUser: (user: User) => void;
    setPage: (page: Page) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        className={`${checked ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
        onClick={() => onChange(!checked)}
    >
        <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
    </button>
);

const SettingsRow: React.FC<{
    label: string;
    description: string;
    children: React.ReactNode;
}> = ({ label, description, children }) => (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
        <div className="text-sm">
            <p className="font-medium text-white">{label}</p>
            <p className="text-gray-400">{description}</p>
        </div>
        <div className="mt-2 sm:mt-0 sm:col-span-2 flex items-center space-x-6 justify-end">
            {children}
        </div>
    </div>
);

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ currentUser, setCurrentUser, setPage }) => {
    // --- FIX: Initialize state correctly using defaults ---
    const [settings, setSettings] = useState<NotificationSettingsType>(
        () => currentUser.notificationSettings ?? { ...DEFAULT_NOTIFICATION_SETTINGS } // Use function form for lazy init
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // --- FIX: Update state correctly in useEffect ---
    useEffect(() => {
        // Only update if currentUser changes AND the settings are different
        // This prevents infinite loops if setCurrentUser causes re-renders
        const userSettings = currentUser.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS;
        if (JSON.stringify(settings) !== JSON.stringify(userSettings)) {
            setSettings(userSettings);
        }
    }, [currentUser.notificationSettings]); // Depend only on the relevant part

    const handleChannelChange = (
        category: keyof Omit<NotificationSettingsType, 'doNotDisturb'>,
        channel: NotificationChannel,
        checked: boolean
    ) => {
        setSettings(prev => {
            // Ensure category exists or default to empty array
            const currentChannels = prev[category] ?? [];
            const newChannels = checked
                ? [...currentChannels, channel]
                : currentChannels.filter(c => c !== channel);
            return { ...prev, [category]: newChannels };
        });
    };

    // --- FIX: Correctly update DND settings, handling potential undefined ---
    const handleDndChange = (
        key: keyof typeof DEFAULT_DND_SETTINGS, // Key must be valid for DND settings
        value: boolean | string
    ) => {
        setSettings(prev => ({
            ...prev,
            doNotDisturb: {
                ...(prev.doNotDisturb ?? DEFAULT_DND_SETTINGS), // Ensure doNotDisturb object exists
                [key]: value,
            },
        }));
    };


    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedUser = await api.updateNotificationSettings(settings);
            if (updatedUser) {
                setCurrentUser(updatedUser); // Update the user context/state globally
                // Update local state ONLY IF necessary, or rely on useEffect
                setSettings(updatedUser.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else {
                throw new Error("No updated user data returned from API.");
            }
        } catch (error: any) {
            console.error("Failed to save settings:", error);
            alert(`Failed to save settings: ${error.message || 'Please try again.'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const settingCategories: { key: keyof Omit<NotificationSettingsType, 'doNotDisturb'>; label: string; description: string }[] = [
        { key: 'collaborationRequests', label: 'Collaboration Requests', description: 'When someone wants to join your idea.' },
        { key: 'collaborationUpdates', label: 'Collaboration Updates', description: 'When your request is approved or a collaboration is recorded.' },
        { key: 'commentsOnMyIdeas', label: 'Comments on Your Ideas', description: 'When someone comments on an idea you own.' },
        { key: 'feedbackOnMyIdeas', label: 'Feedback on Your Ideas', description: 'When someone provides feedback on an idea you own.' },
        { key: 'newConnections', label: 'New Connections', description: 'When another user connects with you.' },
        { key: 'achievementUnlocks', label: 'Achievement Unlocks', description: 'When you unlock a new achievement badge.' },
        { key: 'directMessages', label: 'Direct Messages', description: 'When you receive a new direct message.' },
        { key: 'messageReactions', label: 'Message Reactions', description: 'When someone reacts to your message.' },
    ];

    // --- FIX: Use safe access with defaults for rendering ---
    const dndEnabled = settings.doNotDisturb?.enabled ?? false;
    const dndStartTime = settings.doNotDisturb?.startTime ?? DEFAULT_DND_SETTINGS.startTime;
    const dndEndTime = settings.doNotDisturb?.endTime ?? DEFAULT_DND_SETTINGS.endTime;


    return (
        <div className="bg-[#0A0A0F] min-h-screen">
            <header className="bg-[#1A1A24]/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button onClick={() => setPage('notifications')} className="text-indigo-400">&larr; Back to Notifications</button>
                        <h1 className="text-xl font-bold text-white">Notification Settings</h1>
                        <div className="w-36 flex justify-end">
                            <button onClick={handleSave} disabled={isSaving || saved} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                                {isSaving ? 'Saving...' : (saved ? 'Saved!' : 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10">
                    <div className="divide-y divide-white/10 px-6">
                        {settingCategories.map(({ key, label, description }) => (
                            <SettingsRow key={key} label={label} description={description}>
                                <div className="flex flex-col items-center">
                                    <label className="text-xs font-medium text-gray-400">In-App</label>
                                    <ToggleSwitch
                                        // Use safe access
                                        checked={(settings[key] ?? []).includes('inApp')}
                                        onChange={(checked) => handleChannelChange(key, 'inApp', checked)}
                                    />
                                </div>
                                <div className="flex flex-col items-center">
                                    <label className="text-xs font-medium text-gray-400">Email</label>
                                    <ToggleSwitch
                                        // Use safe access
                                        checked={(settings[key] ?? []).includes('email')}
                                        onChange={(checked) => handleChannelChange(key, 'email', checked)}
                                    />
                                </div>
                            </SettingsRow>
                        ))}
                    </div>
                </div>

                <div className="max-w-3xl mx-auto bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 mt-8">
                     <div className="divide-y divide-white/10 px-6">
                        <SettingsRow label="Do Not Disturb" description="Temporarily mute all notifications during specific hours.">
                            {/* --- FIX: Use safe access variable --- */}
                            <ToggleSwitch checked={dndEnabled} onChange={(checked) => handleDndChange('enabled', checked)} />
                        </SettingsRow>
                         {/* --- FIX: Use safe access variable --- */}
                         {dndEnabled && (
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                                <div className="text-sm font-medium text-white">
                                    Quiet Hours
                                </div>
                                 <div className="mt-2 sm:mt-0 sm:col-span-2 flex items-center space-x-4 justify-end">
                                      <input
                                        type="time"
                                        // --- FIX: Use safe access variable ---
                                        value={dndStartTime}
                                        onChange={e => handleDndChange('startTime', e.target.value)}
                                        className="bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white"
                                      />
                                      <span className="text-gray-400">to</span>
                                      <input
                                        type="time"
                                         // --- FIX: Use safe access variable ---
                                        value={dndEndTime}
                                        onChange={e => handleDndChange('endTime', e.target.value)}
                                        className="bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white"
                                      />
                                 </div>
                            </div>
                        )}
                     </div>
                </div>
            </main>
        </div>
    );
};