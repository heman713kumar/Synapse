import React from 'react';
import { motion } from 'framer-motion';
import { AchievementId } from '../types';
import { ACHIEVEMENTS } from '../constants';
import { Trophy, Share2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from './ui/Dialog';
import { Button } from './ui/Button';

interface Props {
  achievementId: AchievementId;
  onClose: () => void;
  onShare: () => void;
}

export const AchievementUnlockedModal: React.FC<Props> = ({ achievementId, onClose, onShare }) => {
  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md text-center overflow-hidden">
        {/* Confetti background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-500/20 pointer-events-none" />
        <div className="relative">
          <p className="text-xs uppercase font-bold tracking-widest text-amber-500 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Achievement unlocked
          </p>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
            className="mx-auto mt-4 h-24 w-24 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-glow"
          >
            <Trophy className="h-12 w-12" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-2xl font-bold tracking-tight font-space-grotesk"
          >
            {achievement.name}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-1 text-muted-foreground"
          >
            {achievement.description}
          </motion.p>

          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
            <Button variant="ghost" onClick={onClose}>Dismiss</Button>
            <Button variant="gradient" onClick={onShare} leftIcon={<Share2 className="h-4 w-4" />}>
              Share to feed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
