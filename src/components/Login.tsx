
import React, { useState } from 'react';
import { User, Page } from '../types';
import { api } from '../services/mockApiService';

interface LoginProps {
    setCurrentUser: (user: User) => void;
    setPage: (page: Page) => void;
    onGuestLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ setCurrentUser, setPage, onGuestLogin }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (mode === 'login') {
            const user = await api.login(formData.email);
            if (user) {
                setCurrentUser(user);
                setPage(user.onboardingCompleted ? 'feed' : 'onboarding');
            } else {
                setError('Invalid email or password.');
            }
        } else { // Sign up
            const { user, error } = await api.signUp(formData.name, formData.email);
            if (user) {
                setCurrentUser(user);
                setPage('onboarding');
            } else {
                setError(error || 'An unexpected error occurred.');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 bg-white/50 dark:bg-[#1A1A24]/50 backdrop-blur-xl border border-gray-200 dark:border-white/20 p-8 rounded-2xl shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-900/50 animate-fadeInUp">
                <div>
                    <h1 className="text-center text-4xl font-bold text-gradient font-space-grotesk">Synapse</h1>
                    <p className="mt-2 text-center text-gray-500 dark:text-gray-400">Where great ideas meet best executioner.</p>
                </div>

                <div className="bg-gray-100/50 dark:bg-[#101018]/50 p-1.5 rounded-lg flex space-x-2">
                    <button onClick={() => setMode('login')} className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white dark:bg-[#252532] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                        Sign In
                    </button>
                    <button onClick={() => setMode('signup')} className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-white dark:bg-[#252532] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                        Sign Up
                    </button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div>
                            <input
                                name="name"
                                type="text"
                                required
                                aria-label="Full Name"
                                className="appearance-none relative block w-full px-3 py-3 bg-gray-100 dark:bg-[#101018] border-2 border-transparent placeholder-gray-500 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-inner"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>
                    )}
                    <div>
                        <input
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            aria-label="Email address"
                            className="appearance-none relative block w-full px-3 py-3 bg-gray-100 dark:bg-[#101018] border-2 border-transparent placeholder-gray-500 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-inner"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <input
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            aria-label="Password"
                            className="appearance-none relative block w-full px-3 py-3 bg-gray-100 dark:bg-[#101018] border-2 border-transparent placeholder-gray-500 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-inner"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                    
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1A1A24] transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : (mode === 'login' ? 'Sign in' : 'Create Account')}
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-[#1A1A24] text-gray-500">Or</span>
                    </div>
                </div>

                <div>
                    <button
                        onClick={onGuestLogin}
                        className="w-full text-center py-3 px-4 border border-gray-300 dark:border-white/20 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-500/10 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Browse as a Guest
                    </button>
                </div>
            </div>
        </div>
    );
};
