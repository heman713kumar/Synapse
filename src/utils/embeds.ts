/** Detect embeddable URLs and return a normalized embed descriptor */

export type EmbedKind = 'youtube' | 'loom' | 'figma' | 'twitter' | 'github' | 'codepen' | 'spotify' | 'vimeo';

export interface EmbedDescriptor {
  kind: EmbedKind;
  url: string;
  src: string;        // iframe src
  aspect?: string;    // "16/9" | "1/1" etc
  height?: number;
  title: string;
  domain: string;
}

const matchers: { test: RegExp; build: (m: RegExpMatchArray, url: string) => EmbedDescriptor | null }[] = [
  // YouTube
  {
    test: /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/i,
    build: (m, url) => ({
      kind: 'youtube',
      url,
      src: `https://www.youtube.com/embed/${m[1]}`,
      aspect: '16/9',
      title: 'YouTube video',
      domain: 'youtube.com',
    }),
  },
  // Loom
  {
    test: /^https?:\/\/(?:www\.)?loom\.com\/share\/([A-Za-z0-9]+)/i,
    build: (m, url) => ({
      kind: 'loom',
      url,
      src: `https://www.loom.com/embed/${m[1]}`,
      aspect: '16/9',
      title: 'Loom recording',
      domain: 'loom.com',
    }),
  },
  // Figma
  {
    test: /^https?:\/\/(?:www\.)?figma\.com\/(?:file|design|proto)\/([A-Za-z0-9]+)/i,
    build: (_m, url) => ({
      kind: 'figma',
      url,
      src: `https://www.figma.com/embed?embed_host=synapse&url=${encodeURIComponent(url)}`,
      aspect: '4/3',
      title: 'Figma file',
      domain: 'figma.com',
    }),
  },
  // Vimeo
  {
    test: /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i,
    build: (m, url) => ({
      kind: 'vimeo',
      url,
      src: `https://player.vimeo.com/video/${m[1]}`,
      aspect: '16/9',
      title: 'Vimeo video',
      domain: 'vimeo.com',
    }),
  },
  // Spotify
  {
    test: /^https?:\/\/open\.spotify\.com\/(track|episode|album|playlist)\/([A-Za-z0-9]+)/i,
    build: (m, url) => ({
      kind: 'spotify',
      url,
      src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
      height: 152,
      title: 'Spotify',
      domain: 'open.spotify.com',
    }),
  },
  // CodePen
  {
    test: /^https?:\/\/codepen\.io\/([^/]+)\/pen\/([A-Za-z0-9]+)/i,
    build: (m, url) => ({
      kind: 'codepen',
      url,
      src: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`,
      aspect: '4/3',
      title: 'CodePen',
      domain: 'codepen.io',
    }),
  },
  // GitHub repo card (we'll render as a static preview, not iframe)
  {
    test: /^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)/i,
    build: (m, url) => ({
      kind: 'github',
      url,
      src: '', // rendered as card, not iframe
      title: `${m[1]}/${m[2]}`,
      domain: 'github.com',
    }),
  },
  // Twitter / X — rendered as a card
  {
    test: /^https?:\/\/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i,
    build: (_m, url) => ({
      kind: 'twitter',
      url,
      src: '',
      title: 'Tweet',
      domain: 'twitter.com',
    }),
  },
];

export function detectEmbed(url: string): EmbedDescriptor | null {
  if (!url) return null;
  for (const m of matchers) {
    const result = url.match(m.test);
    if (result) return m.build(result, url);
  }
  return null;
}

/** Extract all embed URLs from text body */
export function extractEmbeds(text: string): EmbedDescriptor[] {
  if (!text) return [];
  const urls = text.match(/https?:\/\/\S+/g) ?? [];
  return urls.map((u) => detectEmbed(u.replace(/[),.]+$/, ''))).filter((e): e is EmbedDescriptor => e !== null);
}
