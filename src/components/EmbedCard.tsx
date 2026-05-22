import React from 'react';
import { ExternalLink, Code2 } from 'lucide-react';
import { EmbedDescriptor } from '../utils/embeds';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';

interface Props {
  embed: EmbedDescriptor;
  className?: string;
}

/** Renders an embed for any supported provider. Iframe for streamable, static cards for GH/Twitter. */
export const EmbedCard: React.FC<Props> = ({ embed, className }) => {
  // Static "card" embeds
  if (embed.kind === 'github') {
    return (
      <a href={embed.url} target="_blank" rel="noopener noreferrer" className={cn('block group', className)}>
        <Card interactive>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center">
              <Code2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{embed.title}</p>
              <p className="text-xs text-muted-foreground">{embed.domain}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </CardContent>
        </Card>
      </a>
    );
  }

  if (embed.kind === 'twitter') {
    return (
      <a href={embed.url} target="_blank" rel="noopener noreferrer" className={cn('block group', className)}>
        <Card interactive>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-lg">𝕏</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">View tweet</p>
              <p className="text-xs text-muted-foreground truncate">{embed.url.replace(/^https?:\/\//, '')}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </CardContent>
        </Card>
      </a>
    );
  }

  // Iframe embeds
  const inner = (
    <iframe
      src={embed.src}
      title={embed.title}
      loading="lazy"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      frameBorder={0}
      className="absolute inset-0 w-full h-full"
    />
  );

  return (
    <div className={cn('group relative', className)}>
      <div
        className="relative w-full overflow-hidden rounded-xl border border-border bg-secondary/30"
        style={{ aspectRatio: embed.aspect ?? undefined, height: embed.height }}
      >
        {inner}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <Badge variant="ghost" size="sm" className="capitalize">{embed.kind}</Badge>
        <a href={embed.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
          {embed.domain} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
