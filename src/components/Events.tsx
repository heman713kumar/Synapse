import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowLeft, Plus, Clock, Sparkles, Video, Mic } from 'lucide-react';
import { Page } from '../types';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { toast } from './ui/Toaster';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface EventItem {
  id: string;
  type: 'hackathon' | 'ama' | 'meetup' | 'workshop';
  title: string;
  description: string;
  date: string;
  durationHours?: number;
  location: string; // "Online" or city
  attendees: number;
  host: { name: string; avatarUrl?: string };
  cover: string; // gradient class
  tags: string[];
}

const SEED_EVENTS: EventItem[] = [
  { id: 'e1', type: 'hackathon', title: 'Climate Hack 2026', description: '48-hour build sprint on carbon-tracking apps. $20k in prizes.', date: '2026-06-21T18:00:00Z', durationHours: 48, location: 'Online + SF', attendees: 1280, host: { name: 'Maya Chen' }, cover: 'from-emerald-500 via-teal-500 to-cyan-500', tags: ['climate', 'hackathon'] },
  { id: 'e2', type: 'ama', title: 'AMA with the founder of NotionDB', description: 'Live Q&A on building tools for builders. Bring your questions.', date: '2026-06-15T17:00:00Z', durationHours: 1, location: 'Online (Zoom)', attendees: 410, host: { name: 'Yusuf O.' }, cover: 'from-indigo-500 via-violet-500 to-fuchsia-500', tags: ['ama', 'startups'] },
  { id: 'e3', type: 'workshop', title: 'Pitch your idea in 60 seconds', description: 'Live workshop on tightening your elevator pitch with rapid feedback.', date: '2026-06-12T19:00:00Z', durationHours: 2, location: 'Online', attendees: 220, host: { name: 'Priya R.' }, cover: 'from-amber-500 via-orange-500 to-rose-500', tags: ['workshop', 'pitch'] },
  { id: 'e4', type: 'meetup', title: 'Synapse meetup · NYC', description: 'In-person mixer at WeWork Bryant Park. Free drinks for first 50.', date: '2026-06-18T22:00:00Z', durationHours: 3, location: 'New York, NY', attendees: 95, host: { name: 'Alex Y.' }, cover: 'from-sky-500 via-blue-500 to-indigo-500', tags: ['meetup', 'nyc'] },
  { id: 'e5', type: 'ama', title: 'Build your audience as a solo founder', description: 'AMA with a creator who hit 10k subs in 4 months.', date: '2026-06-25T16:00:00Z', durationHours: 1, location: 'Online', attendees: 180, host: { name: 'Sam K.' }, cover: 'from-fuchsia-500 via-pink-500 to-rose-500', tags: ['creator', 'ama'] },
  { id: 'e6', type: 'hackathon', title: 'AI Agents Hackathon', description: 'Build an autonomous agent in 36 hours. OpenAI sponsoring.', date: '2026-07-04T16:00:00Z', durationHours: 36, location: 'Online', attendees: 2104, host: { name: 'Lena J.' }, cover: 'from-violet-500 via-purple-500 to-fuchsia-500', tags: ['ai', 'hackathon'] },
];

const TYPE_META: Record<EventItem['type'], { icon: React.ElementType; label: string }> = {
  hackathon: { icon: Sparkles, label: 'Hackathon' },
  ama: { icon: Mic, label: 'AMA' },
  meetup: { icon: Users, label: 'Meetup' },
  workshop: { icon: Video, label: 'Workshop' },
};

function formatEventDate(iso: string): { day: string; time: string; weekday: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

export const Events: React.FC<Props> = ({ setPage }) => {
  const [filter, setFilter] = useState<'all' | EventItem['type']>('all');
  const [rsvped, setRsvped] = useLocalStorage<string[]>('synapse-rsvped-events', []);

  const filtered = useMemo(
    () => (filter === 'all' ? SEED_EVENTS : SEED_EVENTS.filter((e) => e.type === filter)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filter]
  );

  const toggleRsvp = (id: string, title: string) => {
    setRsvped((prev) => {
      const is = prev.includes(id);
      toast.success(is ? `Removed RSVP for ${title}` : `RSVP'd to ${title}! Calendar invite incoming.`);
      return is ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">
          Back
        </Button>

        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Events</h1>
              <Badge variant="gradient" size="sm">New</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Hackathons, AMAs, workshops, and meetups across the community.</p>
          </div>
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => toast('Event creation coming soon', { icon: '📅' })}>
            Host event
          </Button>
        </header>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList variant="pills" className="mb-5">
            <TabsTrigger variant="pills" value="all">All</TabsTrigger>
            <TabsTrigger variant="pills" value="hackathon" className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Hackathons</TabsTrigger>
            <TabsTrigger variant="pills" value="ama" className="gap-2"><Mic className="h-3.5 w-3.5" /> AMAs</TabsTrigger>
            <TabsTrigger variant="pills" value="meetup" className="gap-2"><Users className="h-3.5 w-3.5" /> Meetups</TabsTrigger>
            <TabsTrigger variant="pills" value="workshop" className="gap-2"><Video className="h-3.5 w-3.5" /> Workshops</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-0">
            {filtered.map((ev) => {
              const Icon = TYPE_META[ev.type].icon;
              const fmt = formatEventDate(ev.date);
              const isRsvp = rsvped.includes(ev.id);
              return (
                <motion.div key={ev.id} whileHover={{ y: -2 }}>
                  <Card interactive className="overflow-hidden h-full">
                    {/* Cover */}
                    <div className={`h-24 bg-gradient-to-br ${ev.cover} relative`}>
                      <div className="absolute inset-0 bg-mesh opacity-40 mix-blend-overlay" />
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur px-2 py-1 text-[10px] uppercase font-semibold tracking-wider text-white">
                        <Icon className="h-3 w-3" /> {TYPE_META[ev.type].label}
                      </div>
                      <div className="absolute top-3 right-3 rounded-lg bg-black/40 backdrop-blur px-3 py-1.5 text-center text-white">
                        <p className="text-[10px] uppercase font-semibold tracking-wider opacity-80">{fmt.weekday.slice(0, 3)}</p>
                        <p className="text-base font-bold leading-none">{fmt.day}</p>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-semibold leading-snug">{ev.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmt.time}{ev.durationHours ? ` · ${ev.durationHours}h` : ''}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {ev.attendees} going</span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={ev.host.name} src={ev.host.avatarUrl} size="xs" />
                          <span className="text-xs truncate">Hosted by {ev.host.name}</span>
                        </div>
                        <Button size="sm" variant={isRsvp ? 'outline' : 'gradient'} onClick={() => toggleRsvp(ev.id, ev.title)}>
                          {isRsvp ? "You're going" : 'RSVP'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};
