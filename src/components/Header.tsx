'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { scrollToSection } from '@/lib/dom';
import Logo from './Logo';
import NavLink from './NavLink';
import { useProjectImages } from './ProjectImages';
import { projects } from '@/data/projects';

const NAV = [
  ['home', 'Home'], ['projects', 'Projects'], ['plan', 'Explore the villa'], ['process', 'Process'],
  ['why', 'Why Baldwa'], ['philosophy', 'Philosophy'], ['contact', 'Contact'],
] as const;

// PLACEHOLDER: point these at the studio's real profiles.
const SOCIAL = [['Instagram', '#contact'], ['LinkedIn', '#contact'], ['Behance', '#contact']] as const;

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const images = useProjectImages();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menu timeline: fade in, image settles, links slide in one by one.
  useGSAP(() => {
    tl.current = gsap.timeline({ paused: true })
      .fromTo(menu.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: .45, ease: 'power2.out' })
      .fromTo('.mm-in', { scale: 1.08 }, { scale: 1, duration: 1.4, ease: 'expo.out' }, 0)
      .fromTo('.menu-nav a', { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: .7, ease: 'expo.out', stagger: .05 }, .12)
      .fromTo('.menu-social a', { opacity: 0 }, { opacity: 1, duration: .5 }, .4);
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeMenu(); burger.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className={`top${scrolled ? ' scrolled' : ''}`} id="top">
        <NavLink to="home" className="brand" label="Baldwa, back to top"><span id="brand" style={{ display: 'block', lineHeight: 0 }}><Logo id="mh" /></span></NavLink>
        <button ref={burger} className="burger" aria-label="Open menu" aria-expanded={open} aria-controls="menu" onClick={openMenu}>
          <span /><span /><span />
        </button>
      </header>

      <div className="menu" id="menu" ref={menu} role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!open} style={{ visibility: 'hidden' }}>
        <div className="menu-head">
          <NavLink to="home" className="brand" label="Baldwa, back to top" before={closeMenu}><Logo id="mm" /></NavLink>
          <button ref={closeBtn} className="menu-close" aria-label="Close menu" onClick={() => { closeMenu(); burger.current?.focus(); }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 3l20 20M23 3L3 23" /></svg>
          </button>
        </div>
        <div className="menu-body">
          <div className="menu-media">
            <div className="mm-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {images[0] && <img src={images[0]} alt={projects[0].name} />}
            </div>
            <span className="cap">{projects[0].name}</span>
          </div>
          <div className="menu-side">
            <nav className="menu-nav" aria-label="Main">
              {NAV.map(([id, label]) => <NavLink key={id} to={id} before={closeMenu}>{label}</NavLink>)}
            </nav>
            <div className="menu-social">
              {SOCIAL.map(([label, href]) => (
                <a key={label} href={href} onClick={(e) => { if (href.startsWith('#')) { e.preventDefault(); closeMenu().then(() => scrollToSection(href.slice(1))); } }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
