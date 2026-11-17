import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import { BRAND, SERVICES, servicePath } from '@/data/site';

// One page per service from the SEO brief: Architecture, Interior Design, BIM Engineering, Architectural consultancy, PMC.
export const dynamicParams = false;
export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

const find = (slug: string) => SERVICES.find((s) => s.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = find((await params).slug);
  if (!s) return {};
  return {
    title: s.title,
    description: s.description,
    keywords: [s.keyword],
    alternates: { canonical: servicePath(s) },
    openGraph: { title: s.title, description: s.description, type: 'website' },
  };
}

/* eslint-disable @next/next/no-img-element */
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = find((await params).slug);
  if (!s) notFound();
  const ld = {
    '@context': 'https://schema.org', '@type': 'Service', name: s.h1, serviceType: s.nav, description: s.body,
    provider: { '@type': 'ProfessionalService', name: BRAND.long, address: { '@type': 'PostalAddress', addressLocality: BRAND.city, addressRegion: BRAND.region, addressCountry: 'IN' } },
    areaServed: BRAND.city,
  };
  return (
    <PageShell crumbs={[{ label: 'Services' }, { label: s.nav }]} current={servicePath(s)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="pg-art pg-service gut">
        <div className="wrap">
          <header className="pg-head">
            <p className="eyebrow">Services · {s.nav}</p>
            <h1>{s.h1}</h1>
          </header>
          <div className="pg-grid">
            <div className="pg-body"><p>{s.body}</p></div>
            <figure className="pg-fig"><img src={s.image.src} alt={s.image.alt} /></figure>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
