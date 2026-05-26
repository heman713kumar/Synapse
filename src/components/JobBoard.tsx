import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, Search, Filter, Building2, Heart, Plus, Globe } from 'lucide-react';
import { Page } from '../types';
import api from '../services/backendApiService';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { toast } from './ui/Toaster';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

type Commitment = 'full-time' | 'part-time' | 'contract' | 'volunteer' | 'equity-only';
type Remote = 'remote' | 'hybrid' | 'onsite';

// Defensive DTO — accepts both camelCase and snake_case from backend.
interface JobDTO {
  id: string;
  title: string;
  description?: string;
  company?: string;          ideaTitle?: string; idea_title?: string;
  commitment?: Commitment;   workType?: string;  work_type?: string;
  remote?: Remote;
  location?: string;
  salary_min?: number;       salaryMin?: number;
  salary_max?: number;       salaryMax?: number;
  salary_range?: string;     salaryRange?: string;
  equity?: string;
  skills?: string[];         tags?: string[];
  posted_at?: string;        postedAt?: string;  created_at?: string;  createdAt?: string;
  applicant_count?: number;  applicantCount?: number;
  founder_name?: string;     founderName?: string;
  founder_avatar?: string;   founderAvatar?: string;
  founder_verified?: boolean;founderVerified?: boolean;
  emoji?: string;
  applied_by_me?: boolean;   appliedByMe?: boolean;
}

const COMMITMENT_LABEL: Record<Commitment, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  volunteer: 'Volunteer',
  'equity-only': 'Equity only',
};
const REMOTE_LABEL: Record<Remote, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

const pickCommitment = (j: JobDTO): Commitment | undefined =>
  (j.commitment ?? (j.workType as Commitment) ?? (j.work_type as Commitment)) || undefined;
const pickSkills    = (j: JobDTO) => j.skills ?? j.tags ?? [];
const pickPosted    = (j: JobDTO) => j.posted_at ?? j.postedAt ?? j.created_at ?? j.createdAt ?? '';
const pickApplicants= (j: JobDTO) => j.applicant_count ?? j.applicantCount ?? 0;
const pickCompany   = (j: JobDTO) => j.company ?? j.ideaTitle ?? j.idea_title ?? '';
const pickFounder   = (j: JobDTO) => ({
  name:     j.founder_name     ?? j.founderName     ?? 'Synapse user',
  avatar:   j.founder_avatar   ?? j.founderAvatar,
  verified: j.founder_verified ?? j.founderVerified ?? false,
});
const pickSalary = (j: JobDTO) => {
  const min = j.salary_min ?? j.salaryMin;
  const max = j.salary_max ?? j.salaryMax;
  if (min || max) return `$${min ?? '?'}–$${max ?? '?'}k`;
  return j.salary_range ?? j.salaryRange ?? '';
};

export const JobBoard: React.FC<Props> = ({ setPage }) => {
  const [jobs, setJobs] = useState<JobDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [commitment, setCommitment] = useState<'all' | Commitment>('all');

  // "Saved" is a personal UI preference — no backend endpoint for it yet, so
  // we keep it in localStorage. "Applied" is now tracked server-side; we just
  // mirror an optimistic set locally so the button flips immediately on click.
  const [saved, setSaved] = useLocalStorage<string[]>('synapse-saved-jobs', []);
  const [locallyApplied, setLocallyApplied] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    setIsLoading(true); setError(null);
    api.getJobs()
      .then((data) => { if (alive) setJobs(Array.isArray(data) ? data : []); })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || 'Could not reach jobs API.');
        setJobs([]);
      })
      .finally(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const c = pickCommitment(j);
      if (commitment !== 'all' && c !== commitment) return false;
      if (query) {
        const q = query.toLowerCase();
        const skills = pickSkills(j).map((s) => s.toLowerCase());
        if (
          !j.title.toLowerCase().includes(q) &&
          !pickCompany(j).toLowerCase().includes(q) &&
          !skills.some((s) => s.includes(q))
        ) return false;
      }
      return true;
    });
  }, [jobs, query, commitment]);

  const toggleSave = (id: string) => {
    setSaved((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const handleApply = async (j: JobDTO) => {
    setLocallyApplied((prev) => new Set(prev).add(j.id));
    try {
      await api.applyToJob(j.id, { coverLetter: '' });
      toast.success(`Applied to ${j.title} at ${pickCompany(j)}`);
    } catch (err: any) {
      setLocallyApplied((prev) => {
        const next = new Set(prev);
        next.delete(j.id);
        return next;
      });
      toast.error(err?.message || 'Could not submit application.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Jobs at Synapse ideas</h1>
            </div>
            <p className="text-sm text-muted-foreground">Join an idea as a co-founder or hire. Curated, no spam.</p>
          </div>
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => toast('Post a job from your idea\'s page → "Hiring" tab', { icon: '💼' })}>
            Post a job
          </Button>
        </header>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search role, company, or skill"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>Filters</Button>
        </div>

        {isLoading ? (
          <PageLoader label="Loading jobs…" minHeight="40vh" />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-8 w-8" />}
            title={error ? 'Jobs unavailable' : 'No jobs posted yet'}
            description={
              error
                ? 'The jobs service isn\'t reachable. Once the backend + database are running, jobs posted from each idea\'s Hiring tab will appear here.'
                : 'When idea owners post hires, they\'ll show up here.'
            }
          />
        ) : (
          <Tabs value={commitment} onValueChange={(v) => setCommitment(v as any)}>
            <TabsList variant="pills" className="mb-5 overflow-x-auto">
              <TabsTrigger variant="pills" value="all">All ({jobs.length})</TabsTrigger>
              {(['full-time', 'part-time', 'contract', 'volunteer', 'equity-only'] as Commitment[]).map((c) => (
                <TabsTrigger key={c} variant="pills" value={c}>{COMMITMENT_LABEL[c]}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={commitment} className="space-y-3 mt-0">
              {filtered.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No jobs match your filters.</CardContent></Card>
              ) : filtered.map((j) => {
                const isSaved = saved.includes(j.id);
                const isApplied = locallyApplied.has(j.id) || !!j.applied_by_me || !!j.appliedByMe;
                const c = pickCommitment(j);
                const skills = pickSkills(j);
                const founder = pickFounder(j);
                const salary = pickSalary(j);
                return (
                  <motion.div key={j.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card interactive>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 flex items-center justify-center text-2xl shrink-0">{j.emoji || '💼'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <h3 className="font-semibold leading-snug">{j.title}</h3>
                              {pickCompany(j) && (
                                <span className="text-sm text-muted-foreground">at <span className="font-medium text-foreground">{pickCompany(j)}</span></span>
                              )}
                              {founder.verified && <Badge variant="soft" size="sm">✓ Verified</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                              {c && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {COMMITMENT_LABEL[c]}</span>}
                              {j.remote && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {REMOTE_LABEL[j.remote]}</span>}
                              {j.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.location}</span>}
                              {salary && <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" /> {salary}</span>}
                              {j.equity && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {j.equity} equity</span>}
                            </div>
                            {j.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{j.description}</p>}
                            {skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {skills.map((s) => <Badge key={s} variant="soft" size="sm">{s}</Badge>)}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                              <div className="flex items-center gap-2">
                                <Avatar src={founder.avatar} name={founder.name} size="xs" />
                                <span className="text-xs text-muted-foreground">{founder.name}</span>
                                {pickPosted(j) && (
                                  <>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" /> {timeAgo(pickPosted(j))} · {pickApplicants(j)} applicants
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon-sm" aria-label={isSaved ? 'Unsave' : 'Save'} onClick={() => toggleSave(j.id)}>
                                  <Heart className={cn('h-4 w-4', isSaved && 'fill-current text-rose-500')} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={isApplied ? 'outline' : 'gradient'}
                                  onClick={() => handleApply(j)}
                                  disabled={isApplied}
                                >
                                  {isApplied ? 'Applied' : 'Apply'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </motion.div>
  );
};
