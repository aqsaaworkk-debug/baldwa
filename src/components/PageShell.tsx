import Link from 'next/link';
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { ABOUT, BRAND, CONTACT_PAGE, PROJECTS_PAGE, SERVICES_PAGE } from '@/data/site';

// Frame for the inner pages (About, services): header, a breadcrumb, the page's own content, links to the other pages
// (internal linking from the SEO brief), the Start a project call to action and the footer.
export default function PageShell({ crumbs, current, children, showCta = true }: {
  crumbs: { label: string; href?: string }[];
  current: string; // href of this page, left out of the "explore" links
  children: ReactNode;
  showCta?: boolean;
}) {
  const others = [
    { href: ABOUT.path, label: ABOUT.nav },
    { href: PROJECTS_PAGE.path, label: PROJECTS_PAGE.nav },
    { href: SERVICES_PAGE.path, label: SERVICES_PAGE.nav },
    { href: CONTACT_PAGE.path, label: CONTACT_PAGE.nav },
  ].filter((l) => l.href !== current);
  return (
    <>
      <Header />
      <main className="pg">
        <div className="gut">
          <nav className="wrap pg-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              {crumbs.map((c) => <li key={c.label}>{c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>)}
            </ol>
          </nav>
        </div>

        {children}

        <section className="pg-more gut" aria-labelledby="pg-more-title">
          <div className="wrap">
            <h2 id="pg-more-title">Explore {BRAND.long}</h2>
            <ul>
              {others.map((l) => <li key={l.href}><Link href={l.href}><span>{l.label}</span><span aria-hidden="true">→</span></Link></li>)}
            </ul>
          </div>
        </section>

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
