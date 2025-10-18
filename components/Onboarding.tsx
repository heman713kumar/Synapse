

import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/mockApiService';
import { SECTORS, SKILLS } from '../constants';
import * as Icons from './icons';

interface OnboardingProps {
    currentUser: User;
    setCurrentUser: (user: User) => void;
    onComplete: () => void;
}

const ProgressBar: React.FC<{ step: number, totalSteps: number }> = ({ step, totalSteps }) => {
    const progress = Math.max(0, ((step - 1) / (totalSteps - 1)) * 100);
    return (
        <div className="w-full bg-[#252532] rounded-full h-2.5 mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
    );
};

const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
    <div className="text-center animate-fadeInUp">
        <h1 className="text-5xl font-bold text-gradient font-space-grotesk mb-4">Welcome to Thinker-Doer</h1>
        <p className="text-xl text-gray-300 mb-8">The place where great ideas meet brilliant minds.</p>
        <button onClick={onNext} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-opacity active:scale-95">
            Let's Get Started
        </button>
    </div>
);

const InterestStep: React.FC<{
    interests: string[], skills: string[], setInterests: (i: string[]) => void, setSkills: (s: string[]) => void, onNext: () => void, onBack: () => void
}> = ({ interests, skills, setInterests, setSkills, onNext, onBack }) => {
    const toggleSelection = (item: string, list: string[], setter: (l: string[]) => void) => {
        const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
        setter(newList);
    };

    return (
        <div className="animate-fadeInUp">
            <h2 className="text-3xl font-bold text-white mb-2">Tell us about yourself</h2>
            <p className="text-gray-400 mb-6">This will help us personalize your feed. Select at least 3 in total.</p>
            
            <h3 className="font-semibold text-lg text-indigo-300 mb-3">Sectors you're interested in:</h3>
            <div className="flex flex-wrap gap-3 mb-6">
                {SECTORS.map(sector => (
                    <button key={sector} onClick={() => toggleSelection(sector, interests, setInterests)} className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${interests.includes(sector) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-[#252532] border-[#374151] hover:border-indigo-500 text-gray-300'}`}>
                        {sector}
                    </button>
                ))}
            </div>

             <h3 className="font-semibold text-lg text-purple-300 mb-3">Skills you have or are looking for:</h3>
            <div className="flex flex-wrap gap-3">
                {SKILLS.map(skill => (
                    <button key={skill} onClick={() => toggleSelection(skill, skills, setSkills)} className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${skills.includes(skill) ? 'bg-purple-500 border-purple-500 text-white' : 'bg-[#252532] border-[#374151] hover:border-purple-500 text-gray-300'}`}>
                        {skill}
                    </button>
                ))}
            </div>
            
            <div className="mt-8 flex justify-between">
                <button onClick={onBack} className="bg-[#374151] text-white px-6 py-2 rounded-lg hover:bg-[#4b5563]">Back</button>
                <button onClick={onNext} disabled={interests.length + skills.length < 3} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                    Next
                </button>
            </div>
        </div>
    );
};

const ProfileStep: React.FC<{
    bio: string, setBio: (b: string) => void, linkedInUrl: string, setLinkedInUrl: (l: string) => void, portfolioUrl: string, setPortfolioUrl: (p: string) => void, onNext: () => void, onBack: () => void
}> = ({ bio, setBio, linkedInUrl, setLinkedInUrl, portfolioUrl, setPortfolioUrl, onNext, onBack }) => {
    const inputBaseClass = "mt-1 block w-full bg-[#101018] border-2 border-transparent shadow-inner rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";
    return (
        <div className="animate-fadeInUp">
            <h2 className="text-3xl font-bold text-white mb-6">Complete your profile</h2>
            <div className="space-y-6">
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Short Bio <span className="text-red-400">*</span></label>
                    <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} required className={inputBaseClass} placeholder="Tell us about your passions and what you're looking for." />
                </div>
                <div>
                    <label htmlFor="linkedin" className="block text-sm font-medium text-gray-300">LinkedIn Profile (Optional)</label>
                    <input id="linkedin" type="url" value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} className={inputBaseClass} placeholder="https://linkedin.com/in/your-profile" />
                </div>
                <div>
                    <label htmlFor="portfolio" className="block text-sm font-medium text-gray-300">Portfolio/Website (Optional)</label>
                    <input id="portfolio" type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className={inputBaseClass} placeholder="https://github.com/your-username" />
                </div>
            </div>
            <div className="mt-8 flex justify-between">
                <button onClick={onBack} className="bg-[#374151] text-white px-6 py-2 rounded-lg hover:bg-[#4b5563]">Back</button>
                <button onClick={onNext} disabled={!bio.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                    Next
                </button>
            </div>
        </div>
    );
};

const tutorialSteps = [
  { icon: 'SearchIcon', title: 'Discover Ideas', description: 'Explore a feed of innovative ideas from thinkers around the world. Filter by sector, region, and skills to find projects that inspire you.' },
  { icon: 'Edit3Icon', title: 'Share Your Vision', description: 'Have an idea? Post it! Our guided process helps you flesh out your concept and create a visual Idea Board to bring it to life.' },
  { icon: 'UsersIcon', title: 'Collaborate & Build', description: 'Connect with doers, join discussion forums, and work together to turn ideas into reality. Your next great partnership is just a click away.' },
];

const TutorialStep: React.FC<{ onNext: () => void, onBack: () => void, isSubmitting: boolean }> = ({ onNext, onBack, isSubmitting }) => (
    <div className="animate-fadeInUp text-center">
        <h2 className="text-3xl font-bold text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tutorialSteps.map(step => {
                const Icon = Icons[step.icon as keyof typeof Icons] || Icons.LightbulbIcon;
                return (
                    <div key={step.title} className="bg-[#252532]/50 p-6 rounded-xl">
                        <Icon className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                );
            })}
        </div>
        <div className="mt-8 flex justify-between">
            <button onClick={onBack} className="bg-[#374151] text-white px-6 py-2 rounded-lg hover:bg-[#4b5563]">Back</button>
            <button onClick={onNext} disabled={isSubmitting} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                {isSubmitting ? 'Finalizing...' : 'Enter the Platform'}
            </button>
        </div>
    </div>
);


export const Onboarding: React.FC<OnboardingProps> = ({ currentUser, setCurrentUser, onComplete }) => {
    const [step, setStep] = useState(1);
    const [interests, setInterests] = useState<string[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [bio, setBio] = useState('');
    const [linkedInUrl, setLinkedInUrl] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleCompleteOnboarding = async () => {
        setIsSubmitting(true);
        const updatedData: Partial<User> = {
            bio,
            interests,
            skills: skills.map(skillName => ({ skillName, endorsers: [] })),
            linkedInUrl: linkedInUrl || undefined,
            portfolioUrl: portfolioUrl || undefined,
            onboardingCompleted: true,
        };
        const updatedUser = await api.updateUser(currentUser.userId, updatedData);
        if (updatedUser) {
            setCurrentUser(updatedUser);
            onComplete();
        } else {
            alert("Failed to save profile. Please try again.");
            setIsSubmitting(false);
        }
    };
    
    const next = () => setStep(s => s + 1);
    const prev = () => setStep(s => s - 1);

    const renderStep = () => {
        switch (step) {
            case 1:
                return <WelcomeStep onNext={next} />;
            case 2:
                return <InterestStep interests={interests} skills={skills} setInterests={setInterests} setSkills={setSkills} onNext={next} onBack={prev} />;
            case 3:
                return <ProfileStep bio={bio} setBio={setBio} linkedInUrl={linkedInUrl} setLinkedInUrl={setLinkedInUrl} portfolioUrl={portfolioUrl} setPortfolioUrl={setPortfolioUrl} onNext={next} onBack={prev} />;
            case 4:
                return <TutorialStep onNext={handleCompleteOnboarding} onBack={prev} isSubmitting={isSubmitting} />;
            default:
                return <WelcomeStep onNext={next} />;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] p-4">
             <div className="max-w-3xl w-full bg-[#1A1A24]/70 backdrop-blur-md border border-white/10 p-8 md:p-12 rounded-2xl shadow-2xl">
                 {step > 1 && <ProgressBar step={step} totalSteps={5} />}
                 {renderStep()}
             </div>
        </div>
    );
};