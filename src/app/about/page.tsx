import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import PageMotion from '@/components/PageMotion';
import PageHero from '@/components/PageHero';
import { ABOUT, HOME, ORG_LD } from '@/data/site';

export const metadata: Metadata = {
  title: ABOUT.title,
  description: ABOUT.description,
  alternates: { canonical: ABOUT.path },
  openGraph: { title: ABOUT.title, description: ABOUT.description, type: 'website' },
};

// About (client, 2026-11-24, after a StoryMuse "About us" reference), in three bands:
//   1. navy: a large "About Us", the SEO H1 under it, and the founder's portrait reaching down into the almond band, with the
//      founder's name set large behind it, standing on the navy's bottom edge (client, 2026-11-26, after an "ARCHIFORM" sample)
//   2. almond: a small line, a large statement with light-weight emphasis, the About text in two columns, full width
//   3. almond: a small photo beside "Why Choose Baldwa and Associates?" and its three points (where the reference has a quote)
// (The navy "Our Professional services" band was removed on request, 2026-11-26.)
// Navy bands carry data-head="light" so the header turns its links light over them (Header.tsx). The hero is the shared
// PageHero (also on Projects, Services and Contact).

/* eslint-disable @next/next/no-img-element */
export default function AboutPage() {
  const f = ABOUT.founder;
  // "Why Choose" in the regular weight, the studio name light
  const whyLead = HOME.why.h2.match(/^Why Choose /)?.[0] ?? '';
  const whyName = HOME.why.h2.slice(whyLead.length);
  return (
    <PageShell crumbs={[{ label: ABOUT.nav }]} current={ABOUT.path} showCta={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }} />
      <PageMotion />
      <article className="pg-v2">
        <PageHero display={ABOUT.nav} h1={ABOUT.h1} media={{ kind: 'portrait', image: f.image, caption: [f.name, f.role], backName: f.name.replace(/^\[|\]$/g, '') }} />

        <section className="ab-story ab-story--full gut" aria-labelledby="ab-statement">
          <p className="ab-kicker ab-rv">{HOME.thoughtful.h2}</p>
          <h2 className="ab-statement ab-rv" id="ab-statement">
            {ABOUT.statement.map((p, i) => (p.em ? <em key={i}>{p.text}</em> : <span key={i}>{p.text}</span>))}
          </h2>
          <div className="ab-cols ab-rv">{ABOUT.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</div>
        </section>

        <section className="ab-why gut" aria-labelledby="ab-why">
          <div className="ab-why-in">
            <figure className="ab-why-fig ab-rv"><img src={ABOUT.whyImage.src} alt={ABOUT.whyImage.alt} loading="lazy" decoding="async" /></figure>
            <div className="ab-why-copy ab-rv">
              <h2 id="ab-why">{whyLead}<em>{whyName}</em></h2>
              <ul>
                {HOME.why.points.map((p) => <li key={p.title}><h3>{p.title}</h3><p>{p.text}</p></li>)}
              </ul>
            </div>
          </div>
        </section>

      </article>
    </PageShell>
  );
}
