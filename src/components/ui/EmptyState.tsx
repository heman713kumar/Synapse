import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 animate-fade-in-up',
        size === 'sm' && 'py-8',
        size === 'md' && 'py-16',
        size === 'lg' && 'py-24',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary',
            size === 'sm' && 'h-12 w-12',
            size === 'md' && 'h-16 w-16',
            size === 'lg' && 'h-20 w-20'
          )}
        >
          {icon}
        </div>
      )}
      <h3 className={cn(
        'font-semibold text-foreground',
        size === 'sm' && 'text-base',
        size === 'md' && 'text-lg',
        size === 'lg' && 'text-2xl'
      )}>
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          {action && (
            <Button variant="gradient" onClick={action.onClick} leftIcon={action.icon}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
