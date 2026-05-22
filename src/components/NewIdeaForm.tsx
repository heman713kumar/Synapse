import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, AchievementId, IdeaTemplate } from '../types';
import { SECTORS, REGIONS, IDEA_TEMPLATES, SKILLS } from '../constants';
import api from '../services/backendApiService';
import {
  ArrowLeft, ArrowRight, Sparkles, Check, X, Wand2, Tag as TagIcon,
  Lightbulb, BookOpen, Star, Heart, Cpu, Plus, AlertTriangle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { toast } from './ui/Toaster';
import { cn } from '../utils/cn';
import { AIIdeaCoach } from './AIIdeaCoach';
import { useDraft, readDraftOnce, clearDraftByKey } from '../hooks/useDraft';
import { checkContent } from '../utils/contentSafety';

interface NewIdeaFormProps {
  setPage: (page: Page, id?: string) => void;
  setSelectedIdeaId: (id: string) => void;
  onAchievementsUnlock: (achievementIds: AchievementId[]) => void;
}

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  CpuIcon: Cpu,
  BookOpenIcon: BookOpen,
  StarIcon: Star,
  HeartIcon: Heart,
};

const TEMPLATE_COLORS: Record<string, string> = {
  startup: 'from-indigo-500 to-violet-500',
  research: 'from-sky-500 to-blue-500',
  creative: 'from-amber-500 to-orange-500',
  impact: 'from-emerald-500 to-teal-500',
};

const TOTAL_STEPS = 4;

export const NewIdeaForm: React.FC<NewIdeaFormProps> = ({ setPage, setSelectedIdeaId, onAchievementsUnlock }) => {
  // Restore draft on mount (one-shot read)
  const initialDraft = React.useMemo(
    () => readDraftOnce<{
      title: string; summary: string; description: string;
      sector: string; region: string; tags: string[]; requiredSkills: string[];
    }>('new-idea'),
    []
  );
  const [step, setStep] = useState(initialDraft ? 1 : 0);
  const [template, setTemplate] = useState<IdeaTemplate | null>(null);
  const [title, setTitle] = useState(initialDraft?.title ?? '');
  const [summary, setSummary] = useState(initialDraft?.summary ?? '');
  const [description, setDescription] = useState(initialDraft?.description ?? '');
  const [sector, setSector] = useState(initialDraft?.sector ?? '');
  const [region, setRegion] = useState(initialDraft?.region ?? '');
  const [tags, setTags] = useState<string[]>(initialDraft?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(initialDraft?.requiredSkills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [isAIWorking, setIsAIWorking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentWarnings, setContentWarnings] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Autosave draft to localStorage on change
  useDraft('new-idea', { title, summary, description, sector, region, tags, requiredSkills });

  // Toast once if we restored a draft
  useEffect(() => {
    if (initialDraft) toast('Draft restored', { icon: '📝' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags((p) => [...p, t].slice(0, 8));
    setTagInput('');
  };

  const toggleSkill = (s: string) => {
    setRequiredSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  };

  const handleAIRefine = async () => {
    if (!summary && !description) {
      toast('Write a short summary first', { icon: '💡' });
      return;
    }
    setIsAIWorking(true);
    try {
      const result = await api.refineSummary({ summary: summary || description.slice(0, 280) });
      if (result?.refinedSummary) {
        setSummary(result.refinedSummary);
        toast.success('Summary refined ✨');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'AI refine failed');
    } finally {
      setIsAIWorking(false);
    }
  };

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) return title.trim().length >= 3 && summary.trim().length >= 10;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const handleSubmit = async () => {
    // Content safety check across all text fields
    const combined = `${title}\n${summary}\n${description}`;
    const safety = checkContent(combined);
    if (safety.level === 'block') {
      setContentWarnings(safety.reasons);
      toast.error('Please remove disallowed content before publishing');
      return;
    }
    setContentWarnings(safety.reasons);

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim() || summary.trim(),
        sector: sector || undefined,
        region: region || undefined,
        tags,
        requiredSkills,
        isPublic: true,
        progressStage: 'idea-stage' as const,
        isAnonymous,
      } as any;
      const response = await api.addIdea(payload);
      if (response.unlockedAchievements?.length) onAchievementsUnlock(response.unlockedAchievements);
      toast.success('Your idea is live! 🎉');
      clearDraftByKey('new-idea');
      if (response.idea?.ideaId) {
        setSelectedIdeaId(response.idea.ideaId);
        setPage('ideaDetail', response.idea.ideaId);
      } else {
        setPage('feed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to publish idea');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 0: Template picker
  if (step === 0) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-6">
          Back
        </Button>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk">Share a new idea</h1>
            <p className="mt-2 text-muted-foreground">Pick a template to get started, or start from scratch.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => { setTemplate(null); next(); }}
              className="surface surface-hover p-5 text-left flex flex-col items-start"
            >
              <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground mb-3">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Start from scratch</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Free-form blank canvas. No prompts.</p>
            </button>

            {IDEA_TEMPLATES.map((t: IdeaTemplate) => {
              const Icon = TEMPLATE_ICONS[t.icon] ?? Lightbulb;
              const color = TEMPLATE_COLORS[t.id] ?? 'from-indigo-500 to-violet-500';
              return (
                <button
                  key={t.id}
                  onClick={() => { setTemplate(t); next(); }}
                  className="surface surface-hover p-5 text-left flex flex-col items-start group"
                >
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.description}</p>
                  <span className="text-xs font-medium text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Use template →
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  // STEPS 1-4
  return (
    <div className="container max-w-2xl py-8 px-4">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={prev} className="mb-4">
        Back
      </Button>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider">Step {step} of {TOTAL_STEPS}</span>
          <span className="text-muted-foreground">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} gradient />
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1: Basics */}
              {step === 1 && (
                <>
                  <h2 className="text-2xl font-bold tracking-tight font-space-grotesk">The big idea</h2>
                  <p className="text-sm text-muted-foreground mt-1">Give your idea a title and short summary.</p>
                  <div className="mt-6 space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" required>Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={template?.questionnairePrompts?.problemStatement ?? 'A clear, catchy name for your idea'}
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <Label htmlFor="summary" required>Summary</Label>
                        <span className="text-xs text-muted-foreground">{summary.length}/280</span>
                      </div>
                      <Textarea
                        id="summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="One or two sentences that explain what it is and why it matters."
                        rows={3}
                        maxLength={280}
                        autoResize
                      />
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Wand2 className="h-3.5 w-3.5" />}
                          loading={isAIWorking}
                          onClick={handleAIRefine}
                        >
                          Refine with AI
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* AI Idea Coach — context-aware help */}
                  <div className="mt-6">
                    <AIIdeaCoach
                      title={title}
                      description={summary || description}
                      category={sector}
                      onApplySummary={(refined) => setSummary(refined)}
                      onApplyTags={(suggested) => setTags((prev) => Array.from(new Set([...prev, ...suggested])).slice(0, 8))}
                    />
                  </div>
                </>
              )}

              {/* STEP 2: Description */}
              {step === 2 && (
                <>
                  <h2 className="text-2xl font-bold tracking-tight font-space-grotesk">Tell the full story</h2>
                  <p className="text-sm text-muted-foreground mt-1">Add as much detail as you want. You can edit later.</p>
                  <div className="mt-6 space-y-1.5">
                    <Label htmlFor="description">Full description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={template ? Object.values(template.questionnairePrompts).join('\n\n') : 'Problem you\'re solving · Target audience · How it works · Inspiration · What you need help with…'}
                      rows={10}
                      autoResize
                    />
                    <p className="text-xs text-muted-foreground">Markdown supported · Optional but recommended</p>
                  </div>
                </>
              )}

              {/* STEP 3: Tags + Context */}
              {step === 3 && (
                <>
                  <h2 className="text-2xl font-bold tracking-tight font-space-grotesk">Help people find it</h2>
                  <p className="text-sm text-muted-foreground mt-1">Tags, sector, and region help the right collaborators discover your idea.</p>
                  <div className="mt-6 space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="tags">
                        Tags
                        <span className="ml-1 text-xs text-muted-foreground font-normal">({tags.length}/8)</span>
                      </Label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map((t) => (
                          <Badge key={t} variant="soft" size="default">
                            #{t}
                            <button onClick={() => setTags((p) => p.filter((x) => x !== t))} className="ml-1 hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                            e.preventDefault();
                            addTag(tagInput);
                          }
                        }}
                        placeholder="Type a tag and press Enter (e.g. AI, sustainability, mobile)"
                        leftIcon={<TagIcon className="h-4 w-4" />}
                        disabled={tags.length >= 8}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="sector">Sector</Label>
                        <select
                          id="sector"
                          value={sector}
                          onChange={(e) => setSector(e.target.value)}
                          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring"
                        >
                          <option value="">Choose sector</option>
                          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="region">Region</Label>
                        <select
                          id="region"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring"
                        >
                          <option value="">Anywhere / Global</option>
                          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 4: Skills + review */}
              {step === 4 && (
                <>
                  <h2 className="text-2xl font-bold tracking-tight font-space-grotesk">Who can help?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Pick the skills you're looking for — leave empty if you're not seeking collaborators yet.</p>
                  <div className="mt-6 space-y-3">
                    {requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.map((s) => (
                          <Badge key={s} variant="gradient" size="default">
                            {s}
                            <button onClick={() => toggleSkill(s)} className="ml-1 hover:opacity-70">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Input
                      placeholder="Search skills…"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                      {SKILLS.filter((s) => s.toLowerCase().includes(skillInput.toLowerCase()))
                        .slice(0, 30)
                        .map((s) => {
                          const active = requiredSkills.includes(s);
                          return (
                            <button
                              key={s}
                              onClick={() => toggleSkill(s)}
                              className={cn(
                                'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                                active
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-border hover:border-primary/40'
                              )}
                            >
                              {active && <Check className="inline h-3 w-3 mr-1" />}
                              {s}
                            </button>
                          );
                        })}
                    </div>
                    <div className="rounded-lg bg-secondary/50 border border-border p-4 mt-4 space-y-1.5 text-sm">
                      <div className="font-semibold mb-1">Almost there 👀</div>
                      <p className="text-muted-foreground"><span className="font-semibold text-foreground">{title || '(untitled)'}</span></p>
                      <p className="text-muted-foreground text-xs line-clamp-2">{summary}</p>
                      {(tags.length > 0 || sector || region) && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {sector && <Badge variant="ghost" size="sm">{sector}</Badge>}
                          {region && <Badge variant="ghost" size="sm">{region}</Badge>}
                          {tags.map((t) => <Badge key={t} variant="soft" size="sm">#{t}</Badge>)}
                        </div>
                      )}
                    </div>

                    {/* Anonymous toggle */}
                    <label className="mt-4 flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-ring"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Post anonymously</p>
                          <Badge variant="soft" size="sm">🕶️ Stealth</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Hide your name and avatar on this idea. Useful for sensitive concepts. You can reveal yourself later.</p>
                      </div>
                    </label>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Content safety warnings */}
          {contentWarnings.length > 0 && step === TOTAL_STEPS && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
              <div className="flex items-center gap-1.5 text-warning font-semibold mb-1">
                <AlertTriangle className="h-4 w-4" /> Heads up
              </div>
              <ul className="space-y-0.5 text-foreground/85">
                {contentWarnings.map((w) => (
                  <li key={w} className="text-xs">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={prev}>Back</Button>
            {step < TOTAL_STEPS ? (
              <Button
                variant="gradient"
                onClick={next}
                disabled={!canContinue()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="lg"
                onClick={handleSubmit}
                loading={isSubmitting}
                rightIcon={!isSubmitting ? <Sparkles className="h-4 w-4" /> : undefined}
                disabled={!title.trim() || !summary.trim()}
              >
                Publish idea
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
  );
};
