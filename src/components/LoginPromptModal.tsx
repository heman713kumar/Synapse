import React from 'react';
import { Sparkles, ArrowRight, Lightbulb, Users, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLogin: () => void;
}

const PERKS = [
  { icon: Lightbulb, label: 'Share your own ideas' },
  { icon: Users, label: 'Join projects as a collaborator' },
  { icon: MessageSquare, label: 'Chat, comment, and react' },
];

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose, onNavigateToLogin }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-glow mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight font-space-grotesk">Join the conversation</DialogTitle>
          <DialogDescription>
            Sign up free in 30 seconds to unlock everything.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-left">
          {PERKS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.label} className="flex items-center gap-3 text-sm">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{p.label}</span>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2 mt-2">
          <Button
            variant="gradient"
            fullWidth
            size="lg"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => { onClose(); onNavigateToLogin(); }}
          >
            Sign up / Sign in
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Keep browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
