import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, GraduationCap, Calendar, Clock, Star, DollarSign, Filter, Sparkles } from 'lucide-react';
import { Page } from '../types';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { toast } from './ui/Toaster';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface Mentor {
  id: string;
  name: string;
  headline: string;
  avatar?: string;
  expertise: string[];
  rating: number;
  reviews: number;
  rate: number; // USD per 30-min
  nextSlot: string; // ISO
  bio: string;
  verified?: boolean;
}

const MENTORS: Mentor[] = [
  { id: 'm1', name: 'Maya Chen', headline: 'Ex-Stripe, climate tech founder', expertise: ['Climate', 'Fundraising', 'Pitch'], rating: 4.9, reviews: 87, rate: 75, nextSlot: nextSlotIn(8), bio: 'Built and sold a climate analytics company. Happy to review your pitch deck and intro to climate angels.', verified: true },
  { id: 'm2', name: 'Yusuf Okafor', headline: 'YC alum · Solo founder coach', expertise: ['Product', 'GTM', 'YC'], rating: 4.8, reviews: 142, rate: 100, nextSlot: nextSlotIn(24), bio: 'Coached 30+ YC applicants. We can sharpen your one-liner together.', verified: true },
  { id: 'm3', name: 'Priya Raman', headline: 'Design partner at Lightspeed', expertise: ['Design', 'UX', 'Brand'], rating: 5.0, reviews: 41, rate: 90, nextSlot: nextSlotIn(48), bio: 'Reviewing your product through a design-first lens, including user research and brand systems.' },
  { id: 'm4', name: 'Alex Yamamoto', headline: 'Indie hacker · $40k MRR', expertise: ['Bootstrapping', 'SEO', 'Audience'], rating: 4.7, reviews: 60, rate: 50, nextSlot: nextSlotIn(2), bio: 'I write about indie hacking and growth from 0. We can talk distribution, content, or pricing.', verified: true },
  { id: 'm5', name: 'Lena Johansson', headline: 'AI engineer · ex-OpenAI', expertise: ['AI', 'ML', 'Agents'], rating: 4.95, reviews: 28, rate: 120, nextSlot: nextSlotIn(72), bio: 'Building with LLMs? I can help with architecture, prompt design, evals, and shipping production AI.' },
  { id: 'm6', name: 'Sam Kapoor', headline: 'CFO advisor for early-stage', expertise: ['Finance', 'Hiring', 'Ops'], rating: 4.6, reviews: 33, rate: 80, nextSlot: nextSlotIn(36), bio: 'Cash flow, runway, equity splits, first hires — pragmatic financial sanity for founders.' },
];

function nextSlotIn(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

function fmtSlot(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

export const Mentorship: React.FC<Props> = ({ setPage }) => {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string>('All');
  const [booked, setBooked] = useLocalStorage<string[]>('synapse-booked-mentors', []);
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);

  const allTags = useMemo(() => Array.from(new Set(MENTORS.flatMap((m) => m.expertise))).sort(), []);

  const filtered = useMemo(() => {
    return MENTORS.filter((m) => {
      if (tag !== 'All' && !m.expertise.includes(tag)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.headline.toLowerCase().includes(q) && !m.bio.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [query, tag]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Mentorship &amp; Office Hours</h1>
            <Badge variant="gradient" size="sm">New</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Book 30-minute sessions with verified founders, designers, and operators.</p>
        </header>

        <Tabs defaultValue="browse">
          <TabsList variant="pills" className="mb-5">
            <TabsTrigger variant="pills" value="browse" className="gap-2"><Search className="h-3.5 w-3.5" /> Browse mentors</TabsTrigger>
            <TabsTrigger variant="pills" value="bookings" className="gap-2"><Calendar className="h-3.5 w-3.5" /> My bookings ({booked.length})</TabsTrigger>
            <TabsTrigger variant="pills" value="become" className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Become a mentor</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4 mt-0">
            <div className="flex gap-2">
              <Input placeholder="Search mentors…" value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
              <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                {tag}
              </Button>
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {(['All', ...allTags] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    tag === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((m) => (
                <Card key={m.id} interactive>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar src={m.avatar} name={m.name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold truncate">{m.name}</p>
                          {m.verified && <Badge variant="soft" size="sm">✓ Verified</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{m.headline}</p>
                        <div className="flex items-center gap-3 text-xs mt-1.5 text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500 fill-current" /> {m.rating} ({m.reviews})</span>
                          <span className="inline-flex items-center gap-0.5"><DollarSign className="h-3 w-3" /> ${m.rate}/30min</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 min-h-[2.4em]">{m.bio}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.expertise.map((e) => <Badge key={e} variant="ghost" size="sm">{e}</Badge>)}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Next: {fmtSlot(m.nextSlot)}</span>
                      <Button size="sm" variant={booked.includes(m.id) ? 'outline' : 'gradient'} onClick={() => setBookingMentor(m)}>
                        {booked.includes(m.id) ? 'Reschedule' : 'Book'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-0">
            {booked.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-semibold">No upcoming sessions</p>
                  <p className="text-sm text-muted-foreground mt-1">Book a mentor to get personalized feedback.</p>
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-3">
                {booked.map((id) => {
                  const m = MENTORS.find((x) => x.id === id);
                  if (!m) return null;
                  return (
                    <Card key={id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar src={m.avatar} name={m.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{fmtSlot(m.nextSlot)} · 30 min · Zoom link in your email</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setBooked((p) => p.filter((x) => x !== id))}>
                          Cancel
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="become" className="mt-0">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold tracking-tight">Become a Synapse mentor</h3>
                <p className="text-sm text-muted-foreground">Share what you know, set your rate, and Synapse handles the scheduling + payment.</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><span className="text-success">✓</span> You set your hourly rate</li>
                  <li className="flex items-start gap-2"><span className="text-success">✓</span> You pick your availability — calendar sync supported</li>
                  <li className="flex items-start gap-2"><span className="text-success">✓</span> Synapse takes a 12% platform fee</li>
                  <li className="flex items-start gap-2"><span className="text-success">✓</span> Verified mentors get featured placement</li>
                </ul>
                <Button variant="gradient" onClick={() => toast('Application form coming soon — drop us a note at mentors@synapse.app', { icon: '✉️' })}>
                  Apply to be a mentor
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking modal */}
      <Dialog open={!!bookingMentor} onOpenChange={(o) => !o && setBookingMentor(null)}>
        <DialogContent className="max-w-md">
          {bookingMentor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar src={bookingMentor.avatar} name={bookingMentor.name} size="lg" />
                  <div>
                    <DialogTitle>Book {bookingMentor.name}</DialogTitle>
                    <DialogDescription>{bookingMentor.headline}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-semibold">Next available slot</p>
                <p className="text-muted-foreground mt-1">{fmtSlot(bookingMentor.nextSlot)} · 30 minutes</p>
                <p className="font-semibold mt-3 text-base">${bookingMentor.rate}</p>
              </div>
              <p className="text-xs text-muted-foreground">A Zoom link will be sent to your email after payment. Cancel up to 24h before for a full refund.</p>
              <div className="flex gap-2">
                <Button variant="ghost" fullWidth onClick={() => setBookingMentor(null)}>Cancel</Button>
                <Button variant="gradient" fullWidth onClick={() => {
                  setBooked((p) => p.includes(bookingMentor.id) ? p : [...p, bookingMentor.id]);
                  toast.success(`Booked ${bookingMentor.name}!`);
                  setBookingMentor(null);
                }}>
                  Confirm booking
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
