import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import ServiceCards from '@/components/ServiceCards';
import { BRAND, HOME, SERVICES, SERVICES_PAGE } from '@/data/site';

export const metadata: Metadata = {
  title: SERVICES_PAGE.title,
  description: SERVICES_PAGE.description,
  alternates: { canonical: SERVICES_PAGE.path },
  openGraph: { title: SERVICES_PAGE.title, description: SERVICES_PAGE.description, type: 'website' },
};

// Structured data for every service (the services no longer have pages of their own).
const LD = SERVICES.map((s) => ({
  '@context': 'https://schema.org', '@type': 'Service', name: s.h1, serviceType: s.nav, description: s.body,
  provider: { '@type': 'ProfessionalService', name: BRAND.long, address: { '@type': 'PostalAddress', addressLocality: BRAND.city, addressRegion: BRAND.region, addressCountry: 'IN' } },
  areaServed: BRAND.city,
}));

export default function ServicesPage() {
  return (
    <PageShell crumbs={[{ label: SERVICES_PAGE.nav }]} current={SERVICES_PAGE.path}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <article className="pg-art pg-services gut">
        <div className="wrap">
          <header className="pg-head">
            <p className="eyebrow">Baldwa &amp; Associates</p>
            <h1>{SERVICES_PAGE.h1}</h1>
          </header>
          <p className="lede sv-lede">{HOME.thoughtful.support}</p>
          <ServiceCards />
        </div>
      </article>
    </PageShell>
  );
}
