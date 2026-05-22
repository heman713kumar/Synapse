import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import api from '../services/backendApiService';
import { SECTORS, SKILLS } from '../constants';
import {
  Sparkles, ArrowRight, ArrowLeft, Search, Edit3, Users, Check,
  Briefcase, Globe, AtSign, Code2,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';
import { cn } from '../utils/cn';

interface OnboardingProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

export const Onboarding: React.FC<OnboardingProps> = ({ currentUser, setCurrentUser, onComplete }) => {
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState<string[]>(currentUser.interests ?? []);
  const [skills, setSkills] = useState<string[]>(currentUser.skills?.map((s) => s.skillName) ?? []);
  const [bio, setBio] = useState(currentUser.bio ?? '');
  const [headline, setHeadline] = useState(currentUser.headline ?? '');
  const [location, setLocation] = useState(currentUser.location ?? '');
  const [linkedInUrl, setLinkedInUrl] = useState(currentUser.linkedInUrl ?? '');
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser.portfolioUrl ?? '');
  const [userType, setUserType] = useState<'thinker' | 'doer' | 'investor'>(
    (currentUser.userType as any) ?? 'thinker'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setIsSubmitting(true);
    const updatedData: Partial<User> = {
      bio,
      headline,
      location,
      interests,
      skills: skills.map((skillName) => ({ skillName, endorsers: [] })),
      linkedInUrl: linkedInUrl || undefined,
      portfolioUrl: portfolioUrl || undefined,
      userType,
      onboardingCompleted: true,
    };
    try {
      const updatedUser = await api.updateUser(updatedData);
      if (updatedUser) {
        setCurrentUser(updatedUser);
        toast.success('Welcome to Synapse! 🎉');
        onComplete();
      } else throw new Error('No data returned');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save profile');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
      <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-float pointer-events-none" style={{ animationDelay: '1s' }} />

      <div className="relative w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">Step {step} of {TOTAL_STEPS}</span>
            <span className="text-muted-foreground">{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} gradient />
        </div>

        {/* Card */}
        <div className="surface p-6 md:p-10 shadow-2xl shadow-primary/10 min-h-[480px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              {step === 1 && (
                <StepIdentity
                  userType={userType}
                  setUserType={setUserType}
                />
              )}
              {step === 2 && (
                <StepInterests
                  interests={interests}
                  skills={skills}
                  setInterests={setInterests}
                  setSkills={setSkills}
                />
              )}
              {step === 3 && (
                <StepProfile
                  bio={bio} setBio={setBio}
                  headline={headline} setHeadline={setHeadline}
                  location={location} setLocation={setLocation}
                  linkedInUrl={linkedInUrl} setLinkedInUrl={setLinkedInUrl}
                  portfolioUrl={portfolioUrl} setPortfolioUrl={setPortfolioUrl}
                />
              )}
              {step === 4 && <StepReady />}
            </motion.div>
          </AnimatePresence>

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prev}
              disabled={step === 1}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              {step === 3 && (
                <Button variant="ghost" onClick={next}>
                  Skip
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button
                  variant="gradient"
                  onClick={next}
                  disabled={step === 2 && interests.length + skills.length < 3}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {step === 1 ? "Let's go" : 'Continue'}
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleFinish}
                  loading={isSubmitting}
                  rightIcon={!isSubmitting ? <Sparkles className="h-4 w-4" /> : undefined}
                >
                  Enter Synapse
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Step dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i + 1 === step ? 'bg-primary w-8' : i + 1 < step ? 'bg-primary/60 w-1.5' : 'bg-border w-1.5'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── STEP 1: Identity ── */
function StepIdentity({
  userType,
  setUserType,
}: {
  userType: 'thinker' | 'doer' | 'investor';
  setUserType: (t: 'thinker' | 'doer' | 'investor') => void;
}) {
  const options: { id: 'thinker' | 'doer' | 'investor'; label: string; desc: string; emoji: string; color: string }[] = [
    { id: 'thinker', label: 'Thinker', desc: "I have ideas to share and want feedback", emoji: '💡', color: 'from-amber-500 to-orange-500' },
    { id: 'doer', label: 'Doer', desc: "I want to join projects and ship things", emoji: '⚡', color: 'from-emerald-500 to-teal-500' },
    { id: 'investor', label: 'Investor', desc: "I'm looking to back great ideas and teams", emoji: '🚀', color: 'from-violet-500 to-fuchsia-500' },
  ];

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight font-space-grotesk">Welcome to Synapse 👋</h2>
      <p className="mt-2 text-muted-foreground">Let's set up your profile in under 60 seconds. First — how would you describe yourself?</p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        {options.map((opt) => {
          const active = userType === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setUserType(opt.id)}
              className={cn(
                'group relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all',
                active ? 'border-primary bg-primary/5 shadow-glow-sm' : 'border-border hover:border-primary/40'
              )}
            >
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br text-white shadow-md', opt.color)}>
                {opt.emoji}
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{opt.desc}</p>
              </div>
              {active && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4">You can change this anytime in settings.</p>
    </>
  );
}

/* ── STEP 2: Interests + Skills ── */
function StepInterests({
  interests,
  skills,
  setInterests,
  setSkills,
}: {
  interests: string[];
  skills: string[];
  setInterests: (l: string[]) => void;
  setSkills: (l: string[]) => void;
}) {
  const toggle = (item: string, list: string[], setter: (l: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };
  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight font-space-grotesk">What are you into?</h2>
      <p className="mt-2 text-muted-foreground">Pick at least 3 to personalize your feed.</p>

      <div className="mt-6 space-y-5 flex-1 overflow-y-auto scrollbar-thin pr-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Sectors</Label>
            <span className="text-xs text-muted-foreground">{interests.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => {
              const active = interests.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggle(s, interests, setInterests)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/40'
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Skills you have or want to learn</Label>
            <span className="text-xs text-muted-foreground">{skills.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => {
              const active = skills.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggle(s, skills, setSkills)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                    active
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-violet-500'
                      : 'bg-background border-border hover:border-violet-500/40'
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {interests.length + skills.length < 3 ? (
          <Badge variant="warning" size="sm">Pick {3 - interests.length - skills.length} more</Badge>
        ) : (
          <Badge variant="success" size="sm" dot>Great selection!</Badge>
        )}
      </div>
    </>
  );
}

/* ── STEP 3: Profile ── */
function StepProfile({
  bio, setBio, headline, setHeadline, location, setLocation,
  linkedInUrl, setLinkedInUrl, portfolioUrl, setPortfolioUrl,
}: {
  bio: string; setBio: (b: string) => void;
  headline: string; setHeadline: (h: string) => void;
  location: string; setLocation: (l: string) => void;
  linkedInUrl: string; setLinkedInUrl: (l: string) => void;
  portfolioUrl: string; setPortfolioUrl: (p: string) => void;
}) {
  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight font-space-grotesk">Add a little personality</h2>
      <p className="mt-2 text-muted-foreground">Profiles with a bio get 3× more responses. This is all optional.</p>
      <div className="mt-6 space-y-4 flex-1">
        <div className="space-y-1.5">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            placeholder="Product designer · Builder of things"
            leftIcon={<AtSign className="h-4 w-4" />}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="San Francisco, CA"
              leftIcon={<Globe className="h-4 w-4" />}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/you"
              leftIcon={<Briefcase className="h-4 w-4" />}
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="portfolio">Portfolio or GitHub</Label>
          <Input
            id="portfolio"
            type="url"
            placeholder="https://your-site.com"
            leftIcon={<Code2 className="h-4 w-4" />}
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span className="text-xs text-muted-foreground">{bio.length}/240</span>
          </div>
          <Textarea
            id="bio"
            rows={3}
            maxLength={240}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What are you building, exploring, or curious about?"
          />
        </div>
      </div>
    </>
  );
}

/* ── STEP 4: Ready ── */
function StepReady() {
  const features = [
    { icon: Search, title: 'Discover ideas', desc: 'A feed personalized to your skills and interests, updated in real time.' },
    { icon: Edit3, title: 'Share your spark', desc: 'Post an idea with AI-assisted summaries, then iterate publicly.' },
    { icon: Users, title: 'Build together', desc: 'Find collaborators by skill, chat in real time, manage tasks on Kanban.' },
  ];
  return (
    <div className="text-center flex-1 flex flex-col justify-center">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow mb-4">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight font-space-grotesk">You're all set</h2>
      <p className="mt-2 text-muted-foreground">Here's a quick tour of what you can do.</p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="surface p-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
