import type { Metadata } from 'next';
import Contact from '@/components/Contact';
import Faq from '@/components/Faq';
import PageShell from '@/components/PageShell';
import { CONTACT_PAGE, FAQ_LD } from '@/data/site';

export const metadata: Metadata = {
  title: CONTACT_PAGE.title,
  description: CONTACT_PAGE.description,
  alternates: { canonical: CONTACT_PAGE.path },
  openGraph: { title: CONTACT_PAGE.title, description: CONTACT_PAGE.description, type: 'website' },
};

export default function ContactPage() {
  return (
    <PageShell crumbs={[{ label: CONTACT_PAGE.nav }]} current={CONTACT_PAGE.path} showCta={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <article className="pg-art pg-contact gut">
        <div className="wrap">
          <header className="pg-head">
            <p className="eyebrow">Baldwa &amp; Associates</p>
            <h1>{CONTACT_PAGE.h1}</h1>
          </header>
        </div>
      </article>
      <div className="pg-contact-zone">
        <Contact />
        <Faq />
      </div>
    </PageShell>
  );
}
