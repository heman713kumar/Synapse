import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Presentation, ChevronLeft, ChevronRight, Download, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import api from '../services/backendApiService';
import { toast } from './ui/Toaster';
import { Idea } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: Idea;
}

interface DeckSlide {
  title: string;
  body: string;
  accent: string;
}

const DEFAULT_TEMPLATE = (idea: Idea): DeckSlide[] => [
  { title: idea.title, body: idea.summary ?? 'A short pitch.', accent: 'from-indigo-500 via-violet-500 to-fuchsia-500' },
  { title: 'The problem', body: idea.questionnaire?.problemStatement ?? 'Describe the painful problem your idea solves.', accent: 'from-rose-500 to-pink-500' },
  { title: 'Who it\'s for', body: idea.questionnaire?.targetAudience ?? 'Define your target users in 1 sentence.', accent: 'from-amber-500 to-orange-500' },
  { title: 'Our solution', body: idea.description ?? idea.summary ?? 'Explain how the idea solves the problem.', accent: 'from-emerald-500 to-teal-500' },
  { title: 'Why now', body: 'Trends, tech, regulation, or behavior shifts that make this the right moment.', accent: 'from-sky-500 to-blue-500' },
  { title: 'How it works', body: 'A simple 3-step explanation of the user flow.', accent: 'from-violet-500 to-fuchsia-500' },
  { title: 'Traction', body: `${idea.likesCount ?? 0} likes · ${idea.commentsCount ?? 0} comments on Synapse so far. Add early metrics here.`, accent: 'from-indigo-500 to-violet-500' },
  { title: 'Business model', body: 'How will it make money? Subscription, marketplace, ads, etc.', accent: 'from-emerald-500 to-cyan-500' },
  { title: 'The team', body: 'Who is building this? Add bios + complementary strengths.', accent: 'from-fuchsia-500 to-pink-500' },
  { title: 'The ask', body: idea.questionnaire?.skillsLooking ?? 'What do you need next — collaborators, capital, customers?', accent: 'from-amber-500 to-rose-500' },
];

export const PitchDeckModal: React.FC<Props> = ({ open, onOpenChange, idea }) => {
  const [slides, setSlides] = useState<DeckSlide[]>(() => DEFAULT_TEMPLATE(idea));
  const [index, setIndex] = useState(0);
  const [generating, setGenerating] = useState(false);

  const handleAIRewrite = async () => {
    setGenerating(true);
    try {
      // Use refineSummary as a generic AI rewrite endpoint
      const newSlides = await Promise.all(
        slides.map(async (s) => {
          if (s.body.length < 20) return s;
          try {
            const res = await api.refineSummary({ summary: `Slide titled "${s.title}". Rewrite this for a venture pitch in 2 short sentences: ${s.body}` });
            return { ...s, body: res.refinedSummary || s.body };
          } catch {
            return s;
          }
        })
      );
      setSlides(newSlides);
      toast.success('Pitch deck refined ✨');
    } catch (e: any) {
      toast.error(e?.message ?? 'AI rewrite failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    const markdown = slides.map((s, i) => `# Slide ${i + 1}: ${s.title}\n\n${s.body}\n`).join('\n---\n\n');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${idea.title.replace(/\W+/g, '-').toLowerCase()}-pitch.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Pitch deck exported as Markdown');
  };

  const current = slides[index];
  const total = slides.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center">
                <Presentation className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Pitch deck — {idea.title}</DialogTitle>
                <DialogDescription>10 slides ready to refine and export.</DialogDescription>
              </div>
            </div>
            <Badge variant="gradient" size="sm">AI</Badge>
          </div>
        </DialogHeader>

        {/* Slide canvas */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={`relative aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br ${current.accent} text-white p-8 md:p-10 shadow-xl`}
            >
              <div className="absolute inset-0 bg-mesh opacity-20 mix-blend-overlay" />
              <div className="relative h-full flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Slide {index + 1} of {total}</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk mt-1 leading-tight">{current.title}</h2>
                <p className="mt-auto text-base md:text-lg leading-relaxed opacity-95 max-w-2xl">{current.body}</p>
                <div className="absolute bottom-4 right-6 text-[10px] uppercase tracking-wider opacity-70 font-semibold">Synapse</div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="absolute inset-y-0 left-0 flex items-center -ml-2">
            <Button variant="glass" size="icon" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} aria-label="Previous slide">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center -mr-2">
            <Button variant="glass" size="icon" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))} disabled={index === total - 1} aria-label="Next slide">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Slide dots */}
        <div className="flex justify-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'bg-primary w-6' : 'bg-border w-1.5'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleAIRewrite} loading={generating} leftIcon={<Wand2 className="h-4 w-4" />}>
            Rewrite with AI
          </Button>
          <Button variant="gradient" onClick={handleExport} leftIcon={<Download className="h-4 w-4" />}>
            Export as Markdown
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
