import React from 'react';
import { EmptyState as UiEmptyState } from './ui/EmptyState';

interface LegacyEmptyStateProps {
  icon?: React.ElementType;
  title: string;
  message?: string;
  description?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

/**
 * Legacy wrapper around the new ui/EmptyState.
 * Kept for backward compatibility with components that still use the old API.
 * Prefer importing { EmptyState } from './ui/EmptyState' directly in new code.
 */
export const EmptyState: React.FC<LegacyEmptyStateProps> = ({ icon: Icon, title, message, description, ctaText, onCtaClick }) => (
  <UiEmptyState
    icon={Icon ? <Icon className="h-8 w-8" /> : undefined}
    title={title}
    description={description ?? message}
    action={ctaText && onCtaClick ? { label: ctaText, onClick: onCtaClick } : undefined}
  />
);
