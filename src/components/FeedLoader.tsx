import React from 'react';
import { Lightbulb } from 'lucide-react';

export const FeedLoader: React.FC<{ label?: string }> = ({ label = 'Curating ideas for you…' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="relative h-14 w-14">
      <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Lightbulb className="h-5 w-5 text-primary animate-pulse-soft" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground tracking-wide animate-pulse-soft">{label}</p>
  </div>
);
