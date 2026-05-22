import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';

interface PageOverlayLoaderProps {
  visible: boolean;
  label?: string;
  sublabel?: string;
}

export const PageOverlayLoader: React.FC<PageOverlayLoaderProps> = ({
  visible,
  label = 'Loading your feed',
  sublabel = 'Fetching ideas, posts & insights…',
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="absolute inset-0 backdrop-blur-md bg-background/70" />

          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 surface px-10 py-8 flex flex-col items-center gap-5 shadow-2xl shadow-primary/20"
          >
            {/* Spinning ring */}
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-accent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary animate-pulse-soft" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-base font-semibold tracking-tight">{label}</p>
              <p className="text-xs text-muted-foreground">{sublabel}</p>
            </div>

            <div className="w-56 space-y-2 pt-2">
              <Skeleton className="h-2 rounded" />
              <Skeleton className="h-2 w-5/6 rounded" />
              <Skeleton className="h-2 w-4/6 rounded" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
