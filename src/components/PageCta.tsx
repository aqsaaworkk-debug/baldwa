import Link from 'next/link';
import { CONTACT_PAGE } from '@/data/site';

// Navy closing band for the inner pages (client, 2026-11-24, in the About page's style): Start a project, one line, a button.
// The copy is the inner pages' existing call to action. .ab-end tells about.css the page ends on navy (the footer's
// rounded shoulders then sit on navy, not almond). Styles: about.css (.ab-cta).
export default function PageCta() {
  return (
    <section className="ab-cta ab-end gut" data-head="light" aria-labelledby="ab-cta-title">
      <div className="ab-cta-in ab-rv">
        <h2 id="ab-cta-title">Start a <em>project</em></h2>
        <p>Tell us about the site and how you want to live.</p>
        <Link href={CONTACT_PAGE.path} className="ab-btn">Start a project</Link>
      </div>
    </section>
  );
}
