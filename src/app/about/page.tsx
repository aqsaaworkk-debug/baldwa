import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { ABOUT, HOME, ORG_LD, SERVICES, servicePath } from '@/data/site';

export const metadata: Metadata = {
  title: ABOUT.title,
  description: ABOUT.description,
  alternates: { canonical: ABOUT.path },
  openGraph: { title: ABOUT.title, description: ABOUT.description, type: 'website' },
};

/* eslint-disable @next/next/no-img-element */
export default function AboutPage() {
  return (
    <PageShell crumbs={[{ label: ABOUT.nav }]} current={ABOUT.path}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }} />
      <article className="pg-art pg-about gut">
        <div className="wrap">
          <header className="pg-head">
            <p className="eyebrow">{ABOUT.nav}</p>
            <h1>{ABOUT.h1}</h1>
          </header>
          <div className="pg-grid">
            <div className="pg-body">{ABOUT.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</div>
            <figure className="pg-fig">
              <img src="/images/projects/arched-villa-dusk.webp" alt="Cream villa at dusk with arched windows, a carved timber door and a columned rotunda lounge, designed by Baldwa and Associates" width={1600} height={815} />
            </figure>
          </div>

          <section className="pg-sub" aria-labelledby="about-why">
            <h2 id="about-why">{HOME.why.h2}</h2>
            <ul className="pg-points">
              {HOME.why.points.map((p) => <li key={p.title}><h3>{p.title}</h3><p>{p.text}</p></li>)}
            </ul>
          </section>

          <section className="pg-sub" aria-labelledby="about-services">
            <h2 id="about-services">{HOME.servicesH2}</h2>
            <ul className="pg-points">
              {SERVICES.map((s) => (
                <li key={s.slug}><h3><Link href={servicePath(s)}>{s.home?.h3 ?? s.h1}</Link></h3><p>{s.home?.text ?? s.description}</p></li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </PageShell>
  );
}
