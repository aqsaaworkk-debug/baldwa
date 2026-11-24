'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap, useGSAP } from '@/lib/gsap';
import Logo from './Logo';
import NavLink from './NavLink';
import { BRAND, PAGE_LINKS } from '@/data/site';

// `inline` (inner pages only, client 2026-11-24): the page links sit in the header and the menu button is hidden on wide
// screens (it stays on phones until the mobile pass). The homepage keeps the menu button.
export default function Header({ inline = false }: { inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const [atFoot, setAtFoot] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const path = usePathname();

  // Menu timeline: the full-screen panel fades in, the links rise into the centre one by one.
  useGSAP(() => {
    tl.current = gsap.timeline({ paused: true })
      .fromTo(menu.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: .45, ease: 'power2.out' })
      .fromTo('.menu-nav a', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'expo.out', stagger: .05 }, .1)
      .fromTo('.menu-cta', { opacity: 0 }, { opacity: 1, duration: .5 }, .4);
  }, { scope: menu });

  const openMenu = () => {
    setOpen(true);
    document.documentElement.classList.add('menu-open');
    tl.current?.timeScale(1).play();
    setTimeout(() => closeBtn.current?.focus(), 60);
  };
  const closeMenu = () => new Promise<void>((resolve) => {
    if (!tl.current) { resolve(); return; }
    tl.current.eventCallback('onReverseComplete', () => {
      setOpen(false);
      document.documentElement.classList.remove('menu-open');
      resolve();
    });
    tl.current.timeScale(1.6).reverse();
  });

  // The header steps aside once the footer fills the lower half of the screen (client, 2026-11-24), and returns above it.
  useEffect(() => {
    const foot = document.querySelector('footer');
    if (!foot) return;
    const io = new IntersectionObserver(([e]) => setAtFoot(e.isIntersecting), { rootMargin: '0px 0px -50% 0px' });
    io.observe(foot);
    return () => io.disconnect();
  }, []);

  // Over a navy band marked data-head="light" (About page) the header's links and menu lines turn light.
  useEffect(() => {
    const bands = Array.from(document.querySelectorAll<HTMLElement>('[data-head="light"]'));
    if (!bands.length) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = 38; // middle of the header bar
      setOnDark(bands.some((b) => { const r = b.getBoundingClientRect(); return r.top <= y && r.bottom > y; }));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const current = (href: string) => (path === href || path.startsWith(`${href}/`) ? 'page' : undefined);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeMenu(); burger.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className={`top${inline ? ' top--inline' : ''}${atFoot ? ' top--away' : ''}${onDark ? ' top--light' : ''}`} id="top" inert={atFoot}>
        <NavLink to="home" className="brand" label={`${BRAND.name}, home`}><span id="brand" style={{ display: 'block', lineHeight: 0 }}><Logo id="mh" /></span></NavLink>
        {inline && (
          <nav className="top-nav" aria-label="Main">
            {PAGE_LINKS.map((l) => <Link key={l.href} href={l.href} aria-current={current(l.href)}>{l.label}</Link>)}
          </nav>
        )}
        <button ref={burger} className="burger" aria-label="Open menu" aria-expanded={open} aria-controls="menu" onClick={openMenu}>
          <span /><span /><span />
        </button>
      </header>

      <div className="menu" id="menu" ref={menu} role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!open} style={{ visibility: 'hidden' }}>
        <div className="menu-head">
          <NavLink to="home" className="brand" label={`${BRAND.name}, home`} before={closeMenu}><Logo id="mm" /></NavLink>
          <button ref={closeBtn} className="menu-close" aria-label="Close menu" onClick={() => { closeMenu(); burger.current?.focus(); }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 3l20 20M23 3L3 23" /></svg>
          </button>
        </div>
        {/* Full screen: the pages in the middle of the screen, Start a project at the foot */}
        <nav className="menu-nav" aria-label="Main">
          {PAGE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)} onClick={() => { closeMenu(); }}>{l.label}</Link>
          ))}
        </nav>
        <div className="menu-cta-row">
          <NavLink to="contact" className="menu-cta" before={closeMenu}>Start a project</NavLink>
        </div>
      </div>
    </>
  );
}
