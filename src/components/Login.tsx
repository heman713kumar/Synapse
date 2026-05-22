import React, { useState } from 'react';
import { User, Page } from '../types';
import api from '../services/backendApiService';
import { Mail, Lock, User as UserIcon, AtSign, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Separator } from './ui/Separator';
import { toast } from './ui/Toaster';

interface LoginProps {
    setCurrentUser: (user: User | null) => void;
    setPage: (page: Page, id?: string) => void;
    onGuestLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ setCurrentUser, setPage, onGuestLogin }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const response = await api.login({ email: formData.email, password: formData.password });
                if (response?.user && response.token) {
                    localStorage.setItem('authToken', response.token);
                    const userId = response.user.userId || (response.user as any).id;
                    const fullUser = await api.getUserById(userId);
                    if (fullUser) {
                        setCurrentUser(fullUser);
                        toast.success(`Welcome back, ${fullUser.displayName ?? fullUser.name ?? 'friend'}!`);
                        setPage(fullUser.onboardingCompleted ? 'feed' : 'onboarding');
                    } else {
                        throw new Error('Login succeeded, but user data could not be found.');
                    }
                } else {
                    setError('Login failed. Please check your credentials.');
                }
            } else {
                const response = await api.signUp({
                    displayName: formData.name,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    userType: 'thinker',
                });
                if (response?.user && response.token) {
                    localStorage.setItem('authToken', response.token);
                    setCurrentUser(response.user as User);
                    toast.success('Account created! Welcome to Synapse 🎉');
                    setPage('onboarding');
                } else {
                    setError(response?.error || 'Sign up failed. Please try again.');
                }
            }
        } catch (err: any) {
            console.error(`${mode} error:`, err);
            setError(err.message || `An unexpected error occurred during ${mode}.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
            {/* Decorative mesh background */}
            <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
            <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
            {/* Floating orbs */}
            <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-float pointer-events-none" />
            <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-float pointer-events-none" style={{ animationDelay: '1s' }} />

            <div className="relative grid lg:grid-cols-2 gap-12 max-w-5xl w-full">
                {/* LEFT: Brand/Marketing */}
                <div className="hidden lg:flex flex-col justify-center space-y-8 animate-fade-in-up">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white font-bold text-xl shadow-glow">S</span>
                        <span className="text-2xl font-bold text-gradient font-space-grotesk">Synapse</span>
                    </div>
                    <h2 className="text-4xl xl:text-5xl font-bold tracking-tight font-space-grotesk leading-tight">
                        Where ideas meet <br />
                        <span className="text-gradient">the people</span> to build them.
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-md">
                        Share what you're thinking. Find collaborators with the right skills. Turn sparks into shipped projects.
                    </p>
                    <ul className="space-y-3 text-sm">
                        {[
                            'Find collaborators by skill, not just by name',
                            'Real-time discussion forums on every idea',
                            'Kanban boards & AI coaching built-in',
                            'Free to start — invite-only investor view',
                        ].map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Sparkles className="h-3 w-3" />
                                </span>
                                <span className="text-muted-foreground">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* RIGHT: Auth form */}
                <div className="w-full max-w-md mx-auto animate-fade-in-up">
                    <div className="surface p-8 shadow-2xl shadow-primary/10">
                        <div className="text-center lg:text-left mb-6">
                            <h1 className="text-2xl font-bold tracking-tight font-space-grotesk">
                                {mode === 'login' ? 'Welcome back' : 'Join Synapse'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {mode === 'login' ? 'Sign in to continue' : 'Create an account to share your first idea'}
                            </p>
                        </div>

                        {/* Mode toggle */}
                        <div className="bg-secondary/50 p-1 rounded-lg flex gap-1 mb-6">
                            {(['login', 'signup'] as const).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => { setMode(m); setError(''); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                                        mode === m
                                            ? 'bg-card text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {m === 'login' ? 'Sign in' : 'Create account'}
                                </button>
                            ))}
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {mode === 'signup' && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name">Full name</Label>
                                        <Input id="name" name="name" type="text" required placeholder="Ada Lovelace"
                                            leftIcon={<UserIcon className="h-4 w-4" />}
                                            value={formData.name} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="username">Username</Label>
                                        <Input id="username" name="username" type="text" required placeholder="adalovelace"
                                            leftIcon={<AtSign className="h-4 w-4" />}
                                            value={formData.username} onChange={handleInputChange} />
                                    </div>
                                </>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com"
                                    leftIcon={<Mail className="h-4 w-4" />}
                                    value={formData.email} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-baseline">
                                    <Label htmlFor="password">Password</Label>
                                    {mode === 'login' && (
                                        <button type="button" onClick={() => setPage('forgot-password')}
                                            className="text-xs text-primary hover:underline">
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <Input id="password" name="password" type="password"
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    required placeholder="••••••••"
                                    leftIcon={<Lock className="h-4 w-4" />}
                                    value={formData.password} onChange={handleInputChange} />
                            </div>

                            {error && (
                                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" variant="gradient" fullWidth size="lg" loading={isLoading}
                                rightIcon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}>
                                {mode === 'login' ? 'Sign in' : 'Create account'}
                            </Button>
                        </form>

                        <div className="my-6 flex items-center gap-3">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground">OR</span>
                            <Separator className="flex-1" />
                        </div>

                        <Button variant="outline" fullWidth onClick={onGuestLogin}>
                            Continue as guest
                        </Button>

                        <p className="mt-6 text-xs text-center text-muted-foreground">
                            By continuing, you agree to our{' '}
                            <button type="button" onClick={() => setPage('privacyPolicy')} className="underline hover:text-foreground">
                                Privacy Policy
                            </button>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
