import React, { useState } from 'react';
import { Copy, Check, Share2, Mail, AtSign, MessageSquare, Briefcase, Code2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from './ui/Toaster';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Path or absolute URL; absolute is preferred for native share */
  url: string;
}

const SHARE_TARGETS = [
  {
    id: 'twitter',
    label: 'X / Twitter',
    color: 'from-sky-500 to-blue-500',
    icon: AtSign,
    href: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: 'from-sky-600 to-blue-700',
    icon: Briefcase,
    href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: 'from-emerald-500 to-green-600',
    icon: MessageSquare,
    href: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
  },
  {
    id: 'email',
    label: 'Email',
    color: 'from-slate-500 to-zinc-600',
    icon: Mail,
    href: (url: string, text: string) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
  },
];

export const ShareDialog: React.FC<ShareDialogProps> = ({ open, onOpenChange, title, description, url }) => {
  const [copied, setCopied] = useState(false);
  const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: absoluteUrl });
      } catch {/* user cancelled */}
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Share</DialogTitle>
              <DialogDescription className="truncate">{title}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Preview card */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Synapse</p>
          <p className="font-semibold mt-1 line-clamp-2">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
        </div>

        {/* Quick targets */}
        <div className="grid grid-cols-4 gap-2">
          {SHARE_TARGETS.map((t) => {
            const Icon = t.icon;
            return (
              <a
                key={t.id}
                href={t.href(absoluteUrl, title)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] text-muted-foreground">{t.label}</span>
              </a>
            );
          })}
        </div>

        {/* Copy link */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Or copy link</p>
          <div className="flex gap-2">
            <Input value={absoluteUrl} readOnly className="text-xs" onClick={(e) => (e.target as HTMLInputElement).select()} />
            <Button variant={copied ? 'success' : 'gradient'} onClick={handleCopy} leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button variant="outline" fullWidth leftIcon={<Share2 className="h-4 w-4" />} onClick={handleNativeShare}>
            Open native share sheet
          </Button>
        )}

        {/* Embed + Export */}
        <details className="rounded-lg border border-border">
          <summary className="cursor-pointer flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <Code2 className="h-3.5 w-3.5" /> Embed &amp; export
          </summary>
          <div className="px-3 pb-3 space-y-2.5 pt-1">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">Embed code</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`<iframe src="${absoluteUrl}?embed=1" width="100%" height="320" frameborder="0" style="border-radius:12px"></iframe>`}
                  className="text-[10px] font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(`<iframe src="${absoluteUrl}?embed=1" width="100%" height="320" frameborder="0" style="border-radius:12px"></iframe>`);
                    toast.success('Embed code copied');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              fullWidth
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => {
                const md = `# ${title}\n\n${description ?? ''}\n\n---\n\nOriginal: ${absoluteUrl}\n`;
                const blob = new Blob([md], { type: 'text/markdown' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${title.replace(/\W+/g, '-').toLowerCase()}.md`;
                document.body.appendChild(a); a.click(); a.remove();
                toast.success('Exported as Markdown');
              }}
            >
              Download as Markdown
            </Button>
          </div>
        </details>
      </DialogContent>
    </Dialog>
  );
};
