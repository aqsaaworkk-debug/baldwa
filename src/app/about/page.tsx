import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import AboutMotion from '@/components/AboutMotion';
import { ABOUT, CONTACT_PAGE, HOME, ORG_LD, SERVICE_GROUPS, groupPath } from '@/data/site';

export const metadata: Metadata = {
  title: ABOUT.title,
  description: ABOUT.description,
  alternates: { canonical: ABOUT.path },
  openGraph: { title: ABOUT.title, description: ABOUT.description, type: 'website' },
};

// About (client, 2026-11-24, after a StoryMuse "About us" reference), in four bands:
//   1. navy: a large "About Us", the SEO H1 under it, and the founder's portrait reaching down into the almond band
//   2. almond: a small line, a large centred statement with light-weight emphasis, the About text in two columns
//   3. almond: a small photo beside "Why Choose Baldwa and Associates?" and its three points (where the reference has a quote)
//   4. navy: the services heading, intro and Start a project on the left, the three service groups as staggered photo cards
// Navy bands carry data-head="light" so the header turns its links light over them (Header.tsx).

/* eslint-disable @next/next/no-img-element */
export default function AboutPage() {
  const f = ABOUT.founder;
  // "Why Choose" in the regular weight, the studio name light
  const whyLead = HOME.why.h2.match(/^Why Choose /)?.[0] ?? '';
  const whyName = HOME.why.h2.slice(whyLead.length);
  return (
    <PageShell crumbs={[{ label: ABOUT.nav }]} current={ABOUT.path} showCta={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }} />
      <AboutMotion />
      <article className="pg-about2">
        <header className="ab-hero gut" data-head="light">
          <p className="ab-display" aria-hidden="true">{ABOUT.nav}</p>
          <h1 className="ab-h1">{ABOUT.h1}</h1>
          <figure className="ab-portrait">
            <div className="ab-portrait-frame">
              <img src={f.image.src} alt={f.image.alt} width={f.image.width} height={f.image.height} fetchPriority="high" />
            </div>
            <figcaption><span>{f.name}</span><span aria-hidden="true">·</span><span>{f.role}</span></figcaption>
          </figure>
        </header>

        <section className="ab-story gut" aria-labelledby="ab-statement">
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

        <section className="ab-team gut" data-head="light" aria-labelledby="ab-team">
          <div className="ab-team-in">
            <div className="ab-team-copy ab-rv">
              <h2 id="ab-team">Our Professional <em>services</em></h2>
              <p>{HOME.thoughtful.support}</p>
              <Link href={CONTACT_PAGE.path} className="ab-btn">Start a project</Link>
            </div>
            <ul className="ab-cards">
              {SERVICE_GROUPS.map((g, i) => (
                <li key={g.key} className={`ab-card ab-card-${i + 1} ab-rv`}>
                  <Link href={groupPath(g)}>
                    <span className="ab-card-art"><img src={g.image.src} alt={g.image.alt} loading="lazy" decoding="async" /></span>
                    <span className="ab-card-name">{g.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </PageShell>
  );
}
