import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-28 w-28 text-2xl',
};

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizeMap;
  ring?: boolean;
  status?: 'online' | 'offline' | 'busy';
}

const gradientFromName = (name?: string | null) => {
  if (!name) return 'from-indigo-500 to-violet-500';
  const palettes = [
    'from-indigo-500 to-violet-500',
    'from-rose-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-blue-500',
    'from-fuchsia-500 to-purple-500',
    'from-lime-500 to-green-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palettes[Math.abs(hash) % palettes.length];
};

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, src, name, size = 'md', ring, status, ...props }, ref) => (
    <div className="relative inline-flex shrink-0">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-full',
          sizeMap[size],
          ring && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
          className
        )}
        {...props}
      >
        {src ? (
          <AvatarPrimitive.Image
            src={src}
            alt={name ?? 'avatar'}
            className="aspect-square h-full w-full object-cover"
          />
        ) : null}
        <AvatarPrimitive.Fallback
          delayMs={src ? 600 : 0}
          className={cn(
            'flex h-full w-full items-center justify-center bg-gradient-to-br font-semibold text-white',
            gradientFromName(name)
          )}
        >
          {initials(name)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
            status === 'online' && 'bg-success',
            status === 'busy' && 'bg-destructive',
            status === 'offline' && 'bg-muted-foreground'
          )}
        />
      )}
    </div>
  )
);
Avatar.displayName = 'Avatar';

export { Avatar };
