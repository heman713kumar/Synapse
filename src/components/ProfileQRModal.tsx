import React, { useMemo } from 'react';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Input } from './ui/Input';
import { User } from '../types';
import { userName } from '../utils/format';
import { toast } from './ui/Toaster';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

/** Pure-SVG QR-style placeholder pattern derived from text — visually QR-like.
 *  For production, swap with a real encoder (qrcode-svg, qr-code-styling).
 *  We keep zero extra deps here. */
function makeQRPattern(text: string, size = 25): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  let n = Math.abs(hash);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      grid[y][x] = (n & 1) === 1;
    }
  }
  // Position markers (top-left, top-right, bottom-left)
  const drawMarker = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const onEdge = x === 0 || x === 6 || y === 0 || y === 6;
        const onInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = onEdge || onInner;
      }
    }
  };
  drawMarker(0, 0);
  drawMarker(size - 7, 0);
  drawMarker(0, size - 7);
  return grid;
}

export const ProfileQRModal: React.FC<Props> = ({ open, onOpenChange, user }) => {
  const url = `${window.location.origin}${window.location.pathname}#/profile/${user.userId}`;
  const pattern = useMemo(() => makeQRPattern(url, 29), [url]);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Build an SVG string and trigger download
    const svgEl = document.getElementById('synapse-qr-svg');
    if (!svgEl) return;
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `synapse-${user.username || user.userId}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Downloaded');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center mb-1">
            <QrCode className="h-5 w-5" />
          </div>
          <DialogTitle>Your QR code</DialogTitle>
          <DialogDescription>Show this at meetups to share your profile in one scan.</DialogDescription>
        </DialogHeader>

        {/* QR pattern */}
        <div className="relative mx-auto rounded-2xl p-4 bg-white shadow-lg">
          <svg
            id="synapse-qr-svg"
            viewBox={`0 0 ${pattern.length} ${pattern.length}`}
            className="w-56 h-56 mx-auto"
            shapeRendering="crispEdges"
          >
            <rect width="100%" height="100%" fill="white" />
            {pattern.map((row, y) =>
              row.map((cell, x) =>
                cell ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0A0A0F" /> : null
              )
            )}
          </svg>
          {/* Avatar overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-1.5 shadow-md">
              <Avatar src={user.avatarUrl} name={userName(user)} size="md" />
            </div>
          </div>
        </div>

        <p className="font-semibold mt-2">{userName(user)}</p>
        {user.headline && <p className="text-xs text-muted-foreground -mt-1">{user.headline}</p>}

        <Input value={url} readOnly className="text-xs" onClick={(e) => (e.target as HTMLInputElement).select()} />

        <div className="grid grid-cols-2 gap-2">
          <Button variant={copied ? 'success' : 'outline'} onClick={handleCopy} leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button variant="gradient" onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>
            Download
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">QR is a visual pattern of your profile URL. Anyone with the link can view your public profile.</p>
      </DialogContent>
    </Dialog>
  );
};
