import React from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, Search, Sparkles } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';

interface Props {
  setPage: (page: Page, id?: string) => void;
  /** Optional message to show — e.g. "This idea was deleted" instead of generic 404 */
  message?: string;
}

/**
 * 404 / not found — used when a hash route points nowhere or an entity
 * (idea, user, conversation) has been deleted. Friendlier than the silent
 * fallback to Feed.
 */
export const NotFound: React.FC<Props> = ({ setPage, message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-xl py-16 md:py-24 px-4 text-center"
    >
      {/* Big animated glyph */}
      <div className="relative inline-block mb-6">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl md:text-8xl font-bold font-space-grotesk bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
        >
          404
        </motion.div>
        <motion.span
          animate={{ y: [0, -8, 0], rotate: [0, -8, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-3 -right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-500"
        >
          <Sparkles className="h-4 w-4" />
        </motion.span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-space-grotesk">
        {message ? 'Hmm, that\'s gone' : 'Page not found'}
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-md mx-auto">
        {message ?? 'The page you\'re looking for doesn\'t exist, was renamed, or moved to a new home.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
        <Button leftIcon={<Home className="h-4 w-4" />} onClick={() => setPage('feed')}>Back to feed</Button>
        <Button variant="outline" leftIcon={<Compass className="h-4 w-4" />} onClick={() => setPage('explore')}>Explore</Button>
        <Button variant="outline" leftIcon={<Search className="h-4 w-4" />} onClick={() => setPage('search')}>Search</Button>
      </div>

      <p className="text-xs text-muted-foreground mt-10">
        Think this is a bug? <a href="mailto:support@synapse.app" className="text-primary hover:underline">Tell us</a>.
      </p>
    </motion.div>
  );
};
