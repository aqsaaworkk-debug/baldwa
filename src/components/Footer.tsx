'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import NavLink from './NavLink';
import { prefersReducedMotion } from '@/lib/dom';
import { BRAND, PAGE_LINKS } from '@/data/site';

// The client's sun film (buildings orbiting the sun). Its black backdrop is screen-blended into the navy page, so only the
// sun and the houses show. The poster is its first frame, shown until it plays and under reduced motion.
const FILM = { src: '/videos/philosophy-sun.mp4', poster: '/images/philosophy-sun.webp' };

// Sign-off on the dark navy end of the page (PageTone.tsx): the sun film large and faded in the background, the mark and one
// line on the left, the sections on the right, and a quiet base row.
export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const film = useRef<HTMLVideoElement>(null);

  // The film loads and plays only while the footer is near the screen.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const video = film.current!;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => { });
      else video.pause();
    }, { rootMargin: '200px 0px' });
    io.observe(root.current!);
    return () => { io.disconnect(); video.pause(); };
  }, []);

  return (
    <footer className="foot gut" ref={root}>
      <div className="wrap foot-in">
        <div className="foot-main">
          {/* the film sits behind the footer, large and faded, like a backdrop in depth */}
          <div className="foot-film" aria-hidden="true">
            <video ref={film} src={FILM.src} poster={FILM.poster} width={1280} height={720} muted loop playsInline preload="none" tabIndex={-1} />
          </div>
          <div className="foot-left">
            <NavLink to="home" className="brand" label={`${BRAND.name}, home`}><Logo id="mf" /></NavLink>
            <p className="foot-line">{BRAND.summary}</p>
          </div>
          <nav className="foot-nav" aria-label="Footer">
            {PAGE_LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
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
