import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import PageMotion from '@/components/PageMotion';
import ServiceCards from '@/components/ServiceCards';
import { BRAND, HOME, SERVICES, SERVICES_PAGE, SERVICE_GROUPS, groupPath } from '@/data/site';

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

// Services, in the About page's layout (client, 2026-11-24): blue hero with three photos in one even row, one per service group
// (where About has the founder's portrait), each opening its tab below; then the service tabs with each service shown plainly
// across the full width; then the statement, aligned left (client, 2026-11-26; the Start a project band was removed).
export default function ServicesPage() {
  return (
    <PageShell crumbs={[{ label: SERVICES_PAGE.nav }]} current={SERVICES_PAGE.path} showCta={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <PageMotion />
      <article className="pg-v2 pg-services">
        <PageHero display={SERVICES_PAGE.nav} h1={SERVICES_PAGE.h1} tone="smoke"
          media={{ kind: 'trio', items: SERVICE_GROUPS.map((g) => ({ image: g.image, label: g.title, href: groupPath(g) })) }} />
        <section className="ab-body ab-body--up gut">
          <ServiceCards />
        </section>
        <section className="ab-story ab-story--left gut" aria-labelledby="sv-statement">
          <p className="ab-kicker ab-rv">{HOME.thoughtful.h2}</p>
          <h2 className="ab-statement ab-statement--sm ab-rv" id="sv-statement">{HOME.thoughtful.support}</h2>
        </section>
      </article>
    </PageShell>
  );
}
