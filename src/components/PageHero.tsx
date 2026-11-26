import Link from 'next/link';
import type { ReactNode } from 'react';

// Hero for the inner pages (client, 2026-11-24, after the About page's StoryMuse reference): a navy band with a large page word
// (decorative), the page's H1 under it as a quiet subtitle, and the page's image reaching down into the almond band below.
// The navy backdrop is its own element so the header can tell exactly where it is (data-head="light", Header.tsx).
// Media: one portrait (About: the founder), three photos side by side (Services: one per service group), or one wide photo.
// Styles: about.css (.ab-hero*).

type Img = { src: string; alt: string; width?: number; height?: number };
export type HeroMedia =
  // backName: a large word set behind the portrait, standing on the bottom edge of the blue band (About: the founder's name)
  | { kind: 'portrait'; image: Img; caption?: string[]; backName?: string }
  // slot: the page's own content in place of the image (Contact: the enquiry form card)
  | { kind: 'slot' }
  | { kind: 'trio'; items: { image: Img; label: string; href?: string }[] }
  | { kind: 'wide'; image: Img; caption?: string[] };

const Caption = ({ parts }: { parts?: string[] }) => (parts?.length
  ? <figcaption>{parts.map((p, i) => <span key={p}>{i > 0 && <span aria-hidden="true">· </span>}{p}</span>)}</figcaption>
  : null);

/* eslint-disable @next/next/no-img-element */
// tone: which of the theme's blues the hero uses (client, 2026-11-24: not every page navy). About navy, Services blue smoke,
// Projects deep navy, Contact teal blue.
export type HeroTone = 'navy' | 'smoke' | 'deep' | 'teal';

export default function PageHero({ display, h1, media, tone = 'navy', children }: { display: string; h1: string; media: HeroMedia; tone?: HeroTone; children?: ReactNode }) {
  const capped = media.kind === 'trio' || (media.kind !== 'slot' && !!media.caption?.length);
  return (
    <header className={`ab-hero ab-hero--${media.kind} ab-tone--${tone}${capped ? '' : ' ab-hero--nocap'} gut`}>
      <div className="ab-hero-navy" data-head="light" aria-hidden="true" />
      <p className="ab-display" aria-hidden="true">{display}</p>
      <h1 className="ab-h1">{h1}</h1>

      {media.kind === 'portrait' && media.backName && <div className="ab-backname" aria-hidden="true"><span>{media.backName}</span></div>}

      {media.kind === 'slot' && <div className="ab-slot">{children}</div>}

      {media.kind === 'portrait' && (
        <figure className="ab-portrait">
          <div className="ab-portrait-frame ab-hero-media">
            <img src={media.image.src} alt={media.image.alt} width={media.image.width} height={media.image.height} fetchPriority="high" />
          </div>
          <Caption parts={media.caption} />
        </figure>
      )}

      {media.kind === 'wide' && (
        <figure className="ab-wide">
          <div className="ab-wide-frame ab-hero-media">
            <img src={media.image.src} alt={media.image.alt} width={media.image.width} height={media.image.height} fetchPriority="high" />
          </div>
          <Caption parts={media.caption} />
        </figure>
      )}

      {media.kind === 'trio' && (
        <ul className="ab-trio">
          {media.items.map((it, i) => {
            const inner = (
              <>
                <span className="ab-trio-frame ab-hero-media"><img src={it.image.src} alt={it.image.alt} fetchPriority={i === 1 ? 'high' : 'auto'} /></span>
                <span className="ab-trio-label">{it.label}</span>
              </>
            );
            return <li key={it.label} className={`ab-trio-${i + 1}`}>{it.href ? <Link href={it.href}>{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
    </header>
  );
}
