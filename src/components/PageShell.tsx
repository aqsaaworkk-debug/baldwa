import Link from 'next/link';
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import NavLink from './NavLink';
import { ABOUT, BRAND, SERVICES, servicePath } from '@/data/site';

// Frame for the inner pages (About, services): header, a breadcrumb, the page's own content, links to the other pages
// (internal linking from the SEO brief), the Start a project call to action and the footer.
export default function PageShell({ crumbs, current, children }: {
  crumbs: { label: string; href?: string }[];
  current: string; // href of this page, left out of the "explore" links
  children: ReactNode;
}) {
  const others = [{ href: ABOUT.path, label: ABOUT.nav }, ...SERVICES.map((s) => ({ href: servicePath(s), label: s.h1 }))].filter((l) => l.href !== current);
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

        <section className="pg-cta gut" aria-labelledby="pg-cta-title">
          <div className="wrap pg-cta-in">
            <h2 id="pg-cta-title">Start a project</h2>
            <p>Tell us about the site and how you want to live.</p>
            <NavLink to="contact" className="menu-cta">Start a project</NavLink>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
