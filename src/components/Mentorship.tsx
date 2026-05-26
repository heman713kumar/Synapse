import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, GraduationCap, Calendar, Clock, Star, DollarSign, Filter, Sparkles } from 'lucide-react';
import { Page } from '../types';
import api from '../services/backendApiService';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { EmptyState } from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { toast } from './ui/Toaster';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface MentorDTO {
  id?: string;                 userId?: string;       user_id?: string;
  name?: string;               display_name?: string; displayName?: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;         avatarUrl?: string;
  skills?: string[];           expertise?: string[];
  rating?: number;
  reviews?: number;            review_count?: number; reviewCount?: number;
  hourly_rate_cents?: number;  hourlyRateCents?: number;
  next_slot?: string;          nextSlot?: string;
  verified?: boolean;
}

interface BookingDTO {
  id: string;
  mentor_id?: string;          mentorId?: string;
  mentor_name?: string;        mentorName?: string;
  mentor_avatar?: string;      mentorAvatar?: string;
  scheduled_at?: string;       scheduledAt?: string;
  topic?: string;
  status?: string;
}

const pickMentorId   = (m: MentorDTO) => m.userId ?? m.user_id ?? m.id ?? '';
const pickMentorName = (m: MentorDTO) => m.name ?? m.display_name ?? m.displayName ?? 'Mentor';
const pickAvatar     = (m: MentorDTO) => m.avatar_url ?? m.avatarUrl;
const pickSkills     = (m: MentorDTO) => m.skills ?? m.expertise ?? [];
const pickRate       = (m: MentorDTO) => (m.hourly_rate_cents ?? m.hourlyRateCents ?? 0) / 100 / 2; // /30min
const pickReviews    = (m: MentorDTO) => m.reviews ?? m.review_count ?? m.reviewCount ?? 0;
const pickNextSlot   = (m: MentorDTO) => m.next_slot ?? m.nextSlot ?? new Date(Date.now() + 24 * 3600_000).toISOString();
const pickBookingMentorId = (b: BookingDTO) => b.mentor_id ?? b.mentorId ?? '';
const pickBookingSlot     = (b: BookingDTO) => b.scheduled_at ?? b.scheduledAt ?? '';
const pickBookingMentor   = (b: BookingDTO) => ({
  id: pickBookingMentorId(b),
  name: b.mentor_name ?? b.mentorName ?? 'Mentor',
  avatar: b.mentor_avatar ?? b.mentorAvatar,
});

function fmtSlot(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

export const Mentorship: React.FC<Props> = ({ setPage }) => {
  const [mentors, setMentors] = useState<MentorDTO[]>([]);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string>('All');
  const [bookingMentor, setBookingMentor] = useState<MentorDTO | null>(null);
  const [bookingTopic, setBookingTopic] = useState('');
  const [booking, setBooking] = useState(false);

  // "Become a mentor" form
  const [showBecome, setShowBecome] = useState(false);
  const [becomeBio, setBecomeBio] = useState('');
  const [becomeSkills, setBecomeSkills] = useState('');
  const [becomeRate, setBecomeRate] = useState<number>(75);
  const [becomeSubmitting, setBecomeSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    setIsLoading(true); setError(null);
    Promise.all([
      api.getMentors().catch((err): MentorDTO[] => {
        if (alive) setError(err?.message || null);
        return [];
      }),
      // Bookings require auth — silently return [] if unauthenticated/offline.
      api.getMyMentorBookings().catch((): BookingDTO[] => []),
    ])
      .then(([m, b]) => {
        if (!alive) return;
        setMentors(Array.isArray(m) ? m : []);
        setBookings(Array.isArray(b) ? b : []);
      })
      .finally(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(mentors.flatMap((m) => pickSkills(m)))).sort(),
    [mentors],
  );

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      const skills = pickSkills(m);
      if (tag !== 'All' && !skills.includes(tag)) return false;
      if (query) {
        const q = query.toLowerCase();
        const name = pickMentorName(m).toLowerCase();
        const headline = (m.headline || '').toLowerCase();
        const bio = (m.bio || '').toLowerCase();
        if (!name.includes(q) && !headline.includes(q) && !bio.includes(q)) return false;
      }
      return true;
    });
  }, [mentors, query, tag]);

  const bookedMentorIds = useMemo(
    () => new Set(bookings.map(pickBookingMentorId).filter(Boolean)),
    [bookings],
  );

  const handleBook = async () => {
    if (!bookingMentor) return;
    const mentorId = pickMentorId(bookingMentor);
    if (!mentorId) {
      toast.error('Mentor id missing.');
      return;
    }
    setBooking(true);
    try {
      const created = await api.bookMentor({
        mentorId,
        scheduledAt: pickNextSlot(bookingMentor),
        topic: bookingTopic.trim() || undefined,
      });
      setBookings((prev) => [created, ...prev]);
      toast.success(`Booked ${pickMentorName(bookingMentor)}!`);
      setBookingMentor(null);
      setBookingTopic('');
    } catch (err: any) {
      toast.error(err?.message || 'Could not book mentor.');
    } finally {
      setBooking(false);
    }
  };

  const handleBecome = async () => {
    const skills = becomeSkills.split(',').map((s) => s.trim()).filter(Boolean);
    if (!becomeBio.trim() || skills.length === 0) {
      toast.error('Bio and at least one skill are required.');
      return;
    }
    setBecomeSubmitting(true);
    try {
      await api.becomeMentor({
        bio: becomeBio.trim(),
        skills,
        hourlyRateCents: Math.round(becomeRate * 100 * 2), // /hour, doubled from per-30-min
      });
      toast.success('Your mentor application is in!');
      setShowBecome(false);
      setBecomeBio(''); setBecomeSkills(''); setBecomeRate(75);
    } catch (err: any) {
      toast.error(err?.message || 'Could not submit application.');
    } finally {
      setBecomeSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Mentorship &amp; Office Hours</h1>
          </div>
          <p className="text-sm text-muted-foreground">Book 30-minute sessions with verified founders, designers, and operators.</p>
        </header>

        <Tabs defaultValue="browse">
          <TabsList variant="pills" className="mb-5">
            <TabsTrigger variant="pills" value="browse" className="gap-2"><Search className="h-3.5 w-3.5" /> Browse mentors</TabsTrigger>
            <TabsTrigger variant="pills" value="bookings" className="gap-2"><Calendar className="h-3.5 w-3.5" /> My bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger variant="pills" value="become" className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Become a mentor</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4 mt-0">
            <div className="flex gap-2">
              <Input placeholder="Search mentors…" value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
              <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>{tag}</Button>
            </div>

            {allTags.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {(['All', ...allTags] as const).map((t) => (
                  <button key={t} onClick={() => setTag(t)}
                    className={cn(
                      'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      tag === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40',
                    )}>
                    {t}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <PageLoader label="Finding mentors…" minHeight="40vh" />
            ) : mentors.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="h-8 w-8" />}
                title={error ? 'Mentors unavailable' : 'No mentors yet'}
                description={
                  error
                    ? 'The mentorship service isn\'t reachable. Once the backend + database are running, verified mentors will appear here.'
                    : 'No one has registered as a mentor yet. Be the first!'
                }
                action={!error ? { label: 'Become a mentor', onClick: () => setShowBecome(true) } : undefined}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filtered.map((m) => {
                  const id = pickMentorId(m);
                  const skills = pickSkills(m);
                  const alreadyBooked = bookedMentorIds.has(id);
                  return (
                    <Card key={id} interactive>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <Avatar src={pickAvatar(m)} name={pickMentorName(m)} size="lg" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold truncate">{pickMentorName(m)}</p>
                              {m.verified && <Badge variant="soft" size="sm">✓ Verified</Badge>}
                            </div>
                            {m.headline && <p className="text-xs text-muted-foreground truncate">{m.headline}</p>}
                            <div className="flex items-center gap-3 text-xs mt-1.5 text-muted-foreground">
                              {(m.rating ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-0.5">
                                  <Star className="h-3 w-3 text-amber-500 fill-current" /> {m.rating?.toFixed(1)} ({pickReviews(m)})
                                </span>
                              )}
                              {pickRate(m) > 0 && (
                                <span className="inline-flex items-center gap-0.5">
                                  <DollarSign className="h-3 w-3" /> ${pickRate(m).toFixed(0)}/30min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {m.bio && <p className="text-xs text-muted-foreground mt-3 line-clamp-2 min-h-[2.4em]">{m.bio}</p>}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {skills.map((e) => <Badge key={e} variant="ghost" size="sm">{e}</Badge>)}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Next: {fmtSlot(pickNextSlot(m))}
                          </span>
                          <Button size="sm" variant={alreadyBooked ? 'outline' : 'gradient'} onClick={() => setBookingMentor(m)}>
                            {alreadyBooked ? 'Reschedule' : 'Book'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-0">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-semibold">No upcoming sessions</p>
                  <p className="text-sm text-muted-foreground mt-1">Book a mentor to get personalized feedback.</p>
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-3">
                {bookings.map((b) => {
                  const m = pickBookingMentor(b);
                  return (
                    <Card key={b.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar src={m.avatar} name={m.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtSlot(pickBookingSlot(b))} · 30 min
                            {b.status && <> · <span className="capitalize">{b.status}</span></>}
                          </p>
                          {b.topic && <p className="text-xs text-muted-foreground mt-1 truncate">Topic: {b.topic}</p>}
                        </div>
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
                <Button variant="gradient" onClick={() => setShowBecome(true)}>
                  Apply to be a mentor
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking modal */}
      <Dialog open={!!bookingMentor} onOpenChange={(o) => !booking && !o && setBookingMentor(null)}>
        <DialogContent className="max-w-md">
          {bookingMentor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar src={pickAvatar(bookingMentor)} name={pickMentorName(bookingMentor)} size="lg" />
                  <div>
                    <DialogTitle>Book {pickMentorName(bookingMentor)}</DialogTitle>
                    {bookingMentor.headline && <DialogDescription>{bookingMentor.headline}</DialogDescription>}
                  </div>
                </div>
              </DialogHeader>
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-semibold">Next available slot</p>
                <p className="text-muted-foreground mt-1">{fmtSlot(pickNextSlot(bookingMentor))} · 30 minutes</p>
                {pickRate(bookingMentor) > 0 && <p className="font-semibold mt-3 text-base">${pickRate(bookingMentor).toFixed(0)}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="topic">What do you want to discuss? (optional)</Label>
                <Textarea
                  id="topic"
                  rows={3}
                  placeholder="e.g. Feedback on my landing page, advice on fundraising…"
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">A Zoom link will be sent to your email after payment. Cancel up to 24h before for a full refund.</p>
              <div className="flex gap-2">
                <Button variant="ghost" fullWidth onClick={() => setBookingMentor(null)} disabled={booking}>Cancel</Button>
                <Button variant="gradient" fullWidth onClick={handleBook} loading={booking}>
                  Confirm booking
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Become a mentor modal */}
      <Dialog open={showBecome} onOpenChange={(o) => !becomeSubmitting && setShowBecome(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Become a mentor</DialogTitle>
            <DialogDescription>Tell us how you can help and how to reach you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Short bio</Label>
              <Textarea rows={4} placeholder="What's your background and where can you help?"
                value={becomeBio} onChange={(e) => setBecomeBio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Skills (comma-separated)</Label>
              <Input placeholder="Fundraising, Pitch, GTM"
                value={becomeSkills} onChange={(e) => setBecomeSkills(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hourly rate (USD)</Label>
              <Input type="number" min="0"
                value={becomeRate}
                onChange={(e) => setBecomeRate(Number(e.target.value) || 0)}
                leftIcon={<DollarSign className="h-4 w-4" />} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setShowBecome(false)} disabled={becomeSubmitting}>Cancel</Button>
            <Button variant="gradient" fullWidth onClick={handleBecome} loading={becomeSubmitting}>
              Submit application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
