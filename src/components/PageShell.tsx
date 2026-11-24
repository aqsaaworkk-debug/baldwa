import Link from 'next/link';
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { CONTACT_PAGE } from '@/data/site';

// Frame for the inner pages: the header (page links shown in it, client 2026-11-24), the page's own content, the Start a
// project call to action and the footer. The breadcrumb and the "Explore" list of other pages were removed on request
// (2026-11-24); the header links cover them. `crumbs` and `current` are still accepted so the pages need no change.
export default function PageShell({ children, showCta = true }: {
  crumbs?: { label: string; href?: string }[];
  current?: string;
  children: ReactNode;
  showCta?: boolean;
}) {
  return (
    <>
      <Header inline />
      <main className="pg">
        {children}

        {showCta && <section className="pg-cta gut" aria-labelledby="pg-cta-title">
          <div className="wrap pg-cta-in">
            <h2 id="pg-cta-title">Start a project</h2>
            <p>Tell us about the site and how you want to live.</p>
            <Link href={CONTACT_PAGE.path} className="menu-cta">Start a project <span aria-hidden="true">↗</span></Link>
          </div>
        </section>}
      </main>
      <Footer showFilm={false} />
    </>
  );
}
