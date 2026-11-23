'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import NavLink from './NavLink';
import { prefersReducedMotion } from '@/lib/dom';
import { BRAND, HOME_FOOTER_LINKS, PAGE_LINKS } from '@/data/site';

// The client's sun film (buildings orbiting the sun). Its black backdrop is screen-blended into the navy page, so only the
// sun and the houses show. The poster is its first frame, shown until it plays and under reduced motion.
const FILM = { src: '/videos/philosophy-sun.mp4', poster: '/images/philosophy-sun.webp' };

// Sign-off on the dark navy end of the page (PageTone.tsx): the sun film large and faded in the background, the mark and one
// line on the left, the sections on the right, and a quiet base row.
export default function Footer({ showFilm = true }: { showFilm?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const links = showFilm ? HOME_FOOTER_LINKS : PAGE_LINKS;

  // The film loads and plays only while the footer is near the screen.
  useEffect(() => {
    if (!showFilm || prefersReducedMotion()) return;
    const video = film.current;
    if (!video) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => { });
      else video.pause();
    }, { rootMargin: '200px 0px' });
    io.observe(root.current!);
    return () => { io.disconnect(); video.pause(); };
  }, [showFilm]);

  return (
    <footer className={`foot gut${showFilm ? '' : ' foot--quiet'}`} ref={root}>
      <div className="wrap foot-in">
        <div className="foot-main">
          {/* the film sits behind the footer, large and faded, like a backdrop in depth */}
          {showFilm && <div className="foot-film" aria-hidden="true">
            <video ref={film} src={FILM.src} poster={FILM.poster} width={1280} height={720} muted loop playsInline preload="none" tabIndex={-1} />
          </div>}
          <div className="foot-left">
            <NavLink to="home" className="brand" label={`${BRAND.name}, home`}><Logo id="mf" /></NavLink>
            <p className="foot-line">{BRAND.summary}</p>
          </div>
          <nav className="foot-nav" aria-label="Footer">
            {links.map((l) => <Link key={`${l.href} ${l.label}`} href={l.href}>{l.label}</Link>)}
            <NavLink to="contact" className="foot-cta">Start a project</NavLink>
          </nav>
        </div>
        <div className="foot-base">
          <small>© {new Date().getFullYear()} {BRAND.name} · Architecture, BIM engineering &amp; interior design</small>
          <small>{BRAND.city}, {BRAND.region}, {BRAND.country}</small>
        </div>
      </div>
    </footer>
  );
}
