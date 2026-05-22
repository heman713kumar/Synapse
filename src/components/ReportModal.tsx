import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { User } from '../types';
import { REPORT_REASONS } from '../constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';

interface ReportModalProps {
  contentId: string;
  contentType: 'idea' | 'comment' | 'user';
  contentTitle: string;
  currentUser: User;
  onClose: () => void;
  onSubmit: (reason: keyof typeof REPORT_REASONS, details: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  contentId: _contentId,
  contentType,
  contentTitle,
  currentUser: _currentUser,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState<keyof typeof REPORT_REASONS>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      toast.error('Please provide some details');
      return;
    }
    setIsSubmitting(true);
    try {
      onSubmit(reason, details);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Report {contentType}</DialogTitle>
              <DialogDescription>Reports are confidential and reviewed by our moderation team.</DialogDescription>
            </div>
          </div>
          <Badge variant="ghost" size="sm" className="max-w-fit truncate">{contentTitle}</Badge>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reason" required>Reason</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as keyof typeof REPORT_REASONS)}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring"
            >
              {Object.entries(REPORT_REASONS).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="details" required>Details</Label>
              <span className="text-xs text-muted-foreground">{details.length}/500</span>
            </div>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={500}
              required
              placeholder={`Please describe why you're reporting this ${contentType}…`}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="destructive" loading={isSubmitting} leftIcon={!isSubmitting ? <Flag className="h-4 w-4" /> : undefined}>
              Submit report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
