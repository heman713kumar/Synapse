import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Sparkles, ArrowRight, Check, RefreshCw } from 'lucide-react';
import { Page, User } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { PageLoader } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import api from '../services/backendApiService';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
  currentUser: User | null;
}

/**
 * Co-founder match — 5-question quiz → ranks other users by how well they
 * complement the answers. Heuristic: complementary skills score highest
 * (a "doer" wants a "thinker", a backend wants a frontend, etc.).
 */
type Stage = 'idea-stage' | 'team-building' | 'in-development' | 'launched';

interface Answers {
  stage: Stage;
  commitment: 'full-time' | 'part-time' | 'side-project';
  bringingSkills: string[];
  needSkills: string[];
  sector: string;
}

const STAGE_OPTIONS: { id: Stage; label: string; hint: string }[] = [
  { id: 'idea-stage',     label: 'Just an idea',        hint: 'Still exploring' },
  { id: 'team-building',  label: 'Forming the team',    hint: 'Looking for co-founders' },
  { id: 'in-development', label: 'Actively building',   hint: 'MVP in progress' },
  { id: 'launched',       label: 'Already launched',    hint: 'Hiring teammates' },
];

const COMMITMENT_OPTIONS: { id: Answers['commitment']; label: string; hint: string }[] = [
  { id: 'full-time',    label: 'Full-time',    hint: 'All-in, no day job' },
  { id: 'part-time',    label: 'Part-time',    hint: '15-30 hrs/week' },
  { id: 'side-project', label: 'Side project', hint: 'Evenings & weekends' },
];

const SKILL_CHOICES = [
  'Product', 'Engineering', 'Design', 'Marketing', 'Sales', 'Operations',
  'Fundraising', 'Data', 'Research', 'Community', 'Legal', 'Finance',
];

const SECTOR_CHOICES = [
  'AI/ML', 'Fintech', 'Healthtech', 'Climate', 'Education', 'Developer tools',
  'Consumer', 'B2B SaaS', 'Hardware', 'Crypto', 'Marketplaces', 'Open source',
];

interface Match {
  user: User;
  score: number;
  reasons: string[];
}

function normalizeSkills(u: User): string[] {
  if (!Array.isArray(u.skills)) return [];
  return u.skills.map((s: any) => (typeof s === 'string' ? s : s?.skillName || '')).filter(Boolean);
}

function scoreUser(u: User, a: Answers, self: User | null): Match {
  if (self && (u.userId === self.userId)) return { user: u, score: -1, reasons: [] };
  let score = 0;
  const reasons: string[] = [];
  const skills = normalizeSkills(u).map((s) => s.toLowerCase());

  // Complementary skills: they have what we need
  const needMatch = a.needSkills.filter((n) => skills.some((s) => s.includes(n.toLowerCase())));
  if (needMatch.length > 0) {
    score += needMatch.length * 25;
    reasons.push(`Brings ${needMatch.join(', ')}`);
  }

  // Avoid duplication: they already do what we bring (lower priority co-founder)
  const overlap = a.bringingSkills.filter((b) => skills.some((s) => s.includes(b.toLowerCase())));
  if (overlap.length > 0) {
    score -= overlap.length * 5;
  }

  // Interests overlap with our sector
  const interests = (u.interests ?? []).map((i) => i.toLowerCase());
  if (a.sector && interests.some((i) => i.includes(a.sector.toLowerCase()) || a.sector.toLowerCase().includes(i))) {
    score += 15;
    reasons.push(`Interested in ${a.sector}`);
  }

  // Active community member (rough signal: has avatar + bio)
  if (u.bio && u.bio.length > 20) score += 5;
  if (u.isVerified) { score += 8; reasons.push('Verified profile'); }
  if (u.reputationScore && u.reputationScore > 50) {
    score += Math.min(u.reputationScore / 20, 15);
    reasons.push('High community reputation');
  }

  return { user: u, score, reasons };
}

export const CoFounderMatch: React.FC<Props> = ({ setPage, currentUser }) => {
  const [answers, setAnswers] = useLocalStorage<Answers | null>('synapse-cofounder-answers', null);
  const [draft, setDraft] = useState<Answers>(answers ?? {
    stage: 'team-building', commitment: 'part-time', bringingSkills: [], needSkills: [], sector: '',
  });
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(answers ? 5 : 0);

  useEffect(() => {
    if (step !== 5) return;
    let alive = true;
    setUsers(null);
    setError(null);
    api.searchUsers({})
      .then((data) => { if (alive) setUsers(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) { setError('Could not load community.'); setUsers([]); } });
    return () => { alive = false; };
  }, [step]);

  const matches = useMemo<Match[]>(() => {
    if (!users || !answers) return [];
    return users
      .map((u) => scoreUser(u, answers, currentUser))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [users, answers, currentUser]);

  const finish = (a: Answers) => {
    setAnswers(a);
    setStep(5);
  };

  const reset = () => {
    setAnswers(null);
    setDraft({ stage: 'team-building', commitment: 'part-time', bringingSkills: [], needSkills: [], sector: '' });
    setStep(0);
  };

  const toggleArrayItem = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-3xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </span>
          Co-founder match
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Five questions. We rank the community by who'd complement you best.</p>
      </header>

      {step < 5 && (
        <Card>
          <CardContent className="p-5 md:p-7">
            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-secondary')} />
              ))}
            </div>

            {step === 0 && (
              <QuizStep
                title="What stage are you at?"
                onNext={() => setStep(1)}
              >
                <OptionGrid
                  options={STAGE_OPTIONS}
                  value={draft.stage}
                  onChange={(v) => setDraft({ ...draft, stage: v as Stage })}
                />
              </QuizStep>
            )}

            {step === 1 && (
              <QuizStep
                title="How much time can you commit?"
                onBack={() => setStep(0)}
                onNext={() => setStep(2)}
              >
                <OptionGrid
                  options={COMMITMENT_OPTIONS}
                  value={draft.commitment}
                  onChange={(v) => setDraft({ ...draft, commitment: v as Answers['commitment'] })}
                />
              </QuizStep>
            )}

            {step === 2 && (
              <QuizStep
                title="What do you bring to the table?"
                subtitle="Pick all that apply."
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                canAdvance={draft.bringingSkills.length > 0}
              >
                <SkillGrid
                  options={SKILL_CHOICES}
                  selected={draft.bringingSkills}
                  onToggle={(s) => setDraft({ ...draft, bringingSkills: toggleArrayItem(draft.bringingSkills, s) })}
                />
              </QuizStep>
            )}

            {step === 3 && (
              <QuizStep
                title="What do you need a co-founder for?"
                subtitle="Their strengths, not yours."
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
                canAdvance={draft.needSkills.length > 0}
              >
                <SkillGrid
                  options={SKILL_CHOICES}
                  selected={draft.needSkills}
                  onToggle={(s) => setDraft({ ...draft, needSkills: toggleArrayItem(draft.needSkills, s) })}
                />
              </QuizStep>
            )}

            {step === 4 && (
              <QuizStep
                title="Which sector?"
                subtitle="Pick one. Skip if undecided."
                onBack={() => setStep(3)}
                onNext={() => finish(draft)}
                nextLabel="Find matches"
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDraft({ ...draft, sector: '' })}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border',
                      draft.sector === '' ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40',
                    )}
                  >
                    Skip
                  </button>
                  {SECTOR_CHOICES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setDraft({ ...draft, sector: s })}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border',
                        draft.sector === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </QuizStep>
            )}
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <Badge variant="ghost" size="sm" className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </Badge>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={reset}>Redo quiz</Button>
          </div>

          {users === null ? (
            <PageLoader label="Finding matches…" />
          ) : error ? (
            <EmptyState icon={<Users className="h-10 w-10" />} title="Could not load" description={error} />
          ) : matches.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No matches yet"
              description="Try broadening your skill requirements or removing the sector filter."
              action={{ label: 'Redo quiz', onClick: reset, icon: <RefreshCw className="h-4 w-4" /> }}
            />
          ) : (
            <div className="grid gap-3">
              {matches.map((m, i) => (
                <Card key={m.user.userId} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                    <Avatar src={m.user.avatarUrl} name={m.user.displayName || m.user.username} size="lg" />
                    <div className="flex-1 min-w-0">
                      <button onClick={() => setPage('profile', m.user.userId)} className="font-semibold text-sm hover:text-primary truncate block text-left">
                        {m.user.displayName || m.user.username || 'Anonymous'}
                      </button>
                      {m.user.headline && <p className="text-xs text-muted-foreground truncate">{m.user.headline}</p>}
                      {m.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {m.reasons.slice(0, 3).map((r, j) => (
                            <span key={j} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              <Check className="h-2.5 w-2.5" />
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => setPage('profile', m.user.userId)}>View</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

const QuizStep: React.FC<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext: () => void;
  canAdvance?: boolean;
  nextLabel?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, onBack, onNext, canAdvance = true, nextLabel = 'Next', children }) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {children}
    <div className="flex justify-between pt-2">
      {onBack ? <Button variant="ghost" onClick={onBack}>Back</Button> : <span />}
      <Button onClick={onNext} disabled={!canAdvance} rightIcon={<ArrowRight className="h-4 w-4" />}>{nextLabel}</Button>
    </div>
  </div>
);

const OptionGrid: React.FC<{ options: { id: string; label: string; hint: string }[]; value: string; onChange: (v: string) => void }> = ({ options, value, onChange }) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {options.map((o) => (
      <button
        key={o.id}
        onClick={() => onChange(o.id)}
        className={cn(
          'text-left p-3 rounded-xl border transition-all',
          value === o.id ? 'bg-primary/5 border-primary' : 'border-border hover:border-primary/40',
        )}
      >
        <div className="font-semibold text-sm">{o.label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{o.hint}</div>
      </button>
    ))}
  </div>
);

const SkillGrid: React.FC<{ options: string[]; selected: string[]; onToggle: (s: string) => void }> = ({ options, selected, onToggle }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((s) => {
      const on = selected.includes(s);
      return (
        <button
          key={s}
          onClick={() => onToggle(s)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
            on ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40',
          )}
        >
          {on && <Check className="h-3 w-3" />}
          {s}
        </button>
      );
    })}
  </div>
);
