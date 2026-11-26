import type { Metadata } from 'next';
import Contact from '@/components/Contact';
import Faq from '@/components/Faq';
import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import PageMotion from '@/components/PageMotion';
import { CONTACT_PAGE, FAQ_LD } from '@/data/site';

export const metadata: Metadata = {
  title: CONTACT_PAGE.title,
  description: CONTACT_PAGE.description,
  alternates: { canonical: CONTACT_PAGE.path },
  openGraph: { title: CONTACT_PAGE.title, description: CONTACT_PAGE.description, type: 'website' },
};

// Contact, in the About page's layout (client, 2026-11-24): teal hero with the enquiry form card where the other pages have
// their image (client, 2026-11-26: the photo and the form's "Bring us a plot and a conversation" heading were removed), then
// the FAQ close under it (the form is the call to action, so there is no closing band).

export default function ContactPage() {
  return (
    <PageShell crumbs={[{ label: CONTACT_PAGE.nav }]} current={CONTACT_PAGE.path} showCta={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <PageMotion />
      <article className="pg-v2 pg-contact2">
        <PageHero display={CONTACT_PAGE.nav} h1={CONTACT_PAGE.h1} tone="teal" media={{ kind: 'slot' }}>
          <Contact variant="card" />
        </PageHero>
      </article>
      <div className="pg-contact-zone">
        <Faq />
      </div>
    </PageShell>
  );
}
