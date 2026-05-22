import React from 'react';
import { motion } from 'framer-motion';
import { Page } from '../types';
import { ShieldCheck, ArrowLeft, Heart, Lock, BadgeCheck, Ban, Gavel } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Separator } from './ui/Separator';

interface PrivacyPolicyProps {
  setPage: (page: Page) => void;
}

const GUIDELINES = [
  {
    icon: Heart,
    title: 'Be respectful & constructive',
    desc: "Treat everyone with respect. Disagreements happen — handle them constructively. Harassment, hate speech, and personal attacks are not allowed.",
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: Lock,
    title: 'Protect intellectual property',
    desc: 'Only post content you own or have the right to share. Our blockchain timestamping helps establish proof of origin for your ideas.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: BadgeCheck,
    title: 'Keep content appropriate',
    desc: 'Synapse is a professional platform for builders. Obscene, violent, or off-topic content will be removed.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Ban,
    title: 'No spam or scams',
    desc: 'No unsolicited promotion, MLM pitches, or fraudulent activity. Posts should serve ideation and collaboration.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Gavel,
    title: 'Moderation & enforcement',
    desc: 'Report violations using the in-app flow. Our team reviews every report. Violations can result in removal, suspension, or a permanent ban.',
    color: 'from-sky-500 to-blue-500',
  },
];

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ setPage }) => {
  return (
    <div className="container max-w-4xl py-8 px-4">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-6">
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-accent/10 to-fuchsia-500/10 p-8 md:p-12 mb-8">
          <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
          <div className="relative">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow mb-4">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk">Community Guidelines</h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
              Synapse exists to help thinkers, doers, and investors build great things together. These guidelines keep the community safe, useful, and worth your time.
            </p>
          </div>
        </div>

        {/* Guidelines */}
        <div className="grid md:grid-cols-2 gap-4">
          {GUIDELINES.map((g, i) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${g.color} text-white shadow-md mb-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="font-semibold text-lg">{g.title}</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Separator className="my-10" />

        {/* Privacy summary */}
        <Card>
          <CardContent className="p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold tracking-tight font-space-grotesk">Your data, your control</h2>
            <p className="text-muted-foreground">
              We collect only what we need to run Synapse — your account info, the content you create, and basic usage analytics. We never sell your data.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                'Passwords are hashed with bcrypt — we cannot read them.',
                'You can export or delete all your data at any time from Settings.',
                'Email-based 2FA is available; SMS 2FA is on the roadmap.',
                'Reports and moderation actions are kept confidential.',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-2">
              Last updated: 2026 · Questions? Email <a href="mailto:hello@synapse.app" className="text-primary hover:underline">hello@synapse.app</a>.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button variant="gradient" onClick={() => setPage('feed')}>I understand — take me back</Button>
        </div>
      </motion.div>
    </div>
  );
};
