'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';
import { projects } from '@/data/projects';
import { CARD_STAGES } from '@/data/projectStages';
import { useProjectImages } from './ProjectImages';
import NavLink from './NavLink';
import Logo from './Logo';

const ModelViewer = dynamic(() => import('./three/ModelViewer'), { ssr: false });

// Featured projects as a bento grid of blocks (restored on request, 2026-11-26; it replaces the accordion of 2026-11-20).
// Wide screens: the section pins and starts directly on the grid (the opening photo card and the blocks' fly-in were
// removed on request, 2026-11-26); the scroll inside it plays the stage cards. Smaller screens: the same blocks stacked in two
// columns, tipping up as they scroll in. Reduced motion: the blocks shown still. Clicking a project block opens it in a detail panel.
// Today's rules still apply: only the small section label (no big heading), names only on the blocks, one photo per
// project (no hover flip).
// Stage cards (client, 2026-11-26; content per card in projectStages.ts): once the section is pinned, the card's blueprint
// turns into the render under a soft wipe, then on the next stretch of scroll the card itself turns away and fades while
// the design rises out of it as a 3D model standing on the page. Same scrubbed timeline, so scrolling back reverses it.
// The model is clickable: it opens an interactive 3D view (ModelViewer.tsx; drag to turn, scroll to zoom), or, for a card
// without a 3D file yet, the model picture tilting with the pointer.

// area = grid-template-areas name in projects.css · tone = background from the brand palette · z = resting depth (px)
type Tile =
  | { area: string; tone: string; z: number; kind: 'project'; i: number; img?: { src: string; alt: string; contain?: boolean } }
  | { area: string; tone: string; z: number; kind: 'brand' | 'plan' | 'contact' | 'stages' };
const TILES: Tile[] = [
  // Three-storey Residence block shows the client's bed section drawing instead of its photo (client, 2026-11-26)
  { area: 'a', tone: 'white', z: 10, kind: 'project', i: 1, img: { src: '/images/projects/stages/bed-sections.webp', alt: 'Bed drawings: a longitudinal section through the bed, the headboard section at the wing and slat joint, and the bedside unit side section', contain: true } },
  { area: 'b', tone: 'paper', z: 28, kind: 'stages' }, // Wardrobe 1 stage card (was Poolside Villa, project 0)
  { area: 'c', tone: 'stone', z: 30, kind: 'stages' }, // site-to-room stage card (swapped with Formal Dining Room, 2026-11-26)
  { area: 'd', tone: 'white', z: 18, kind: 'project', i: 4 },
  { area: 'e', tone: 'stone', z: 24, kind: 'contact' },
  { area: 'f', tone: 'white', z: 40, kind: 'brand' },
  { area: 'g', tone: 'paper', z: 6, kind: 'project', i: 5 },
  { area: 'h', tone: 'paper', z: 14, kind: 'stages' }, // bed stage card (was Formal Dining Room; it and Arched Living Room are off the grid)
  { area: 'i', tone: 'night', z: 22, kind: 'plan' },
];
const pad = (n: number) => String(n).padStart(2, '0');
const STAGES_AT = 0.3; // where the stage cards start in the pinned timeline (a short hold on the grid first)

// One stage card's story, 2.25 timeline units long: wipe from blueprint to render (0-0.9), hold, then the card turns away
// and fades (from 1.15) while the 3D model rises out of it (from 1.35).
function stageTimeline(tile: HTMLElement) {
  const $ = gsap.utils.selector(tile);
  const t = gsap.timeline();
  t.fromTo($('.pj-st-card'), { '--wipe': 0 }, { '--wipe': 1, duration: 0.9, ease: 'power1.inOut' }, 0)
    .fromTo($('.pj-st-card'), { autoAlpha: 1, rotationY: 0, rotationX: 0, scale: 1, z: 0 },
      { autoAlpha: 0, rotationY: -26, rotationX: 10, scale: 0.88, z: -140, duration: 0.8, ease: 'power2.in' }, 1.15)
    .fromTo($('.pj-st-model'), { autoAlpha: 0, scale: 0.8, rotationY: 24, z: -180, y: 30 },
      { autoAlpha: 1, scale: 0.9, rotationY: 0, z: 0, y: 0, duration: 0.9, ease: 'power3.out' }, 1.35); // ends inside its block
  return t;
}

/* eslint-disable @next/next/no-img-element */
// Stand-in for cards without a 3D file: the model picture, tilting toward the pointer.
function ModelTilt({ src, alt }: { src: string; alt: string }) {
  const box = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const el = box.current!, img = el.querySelector('img')!;
    gsap.set(img, { transformPerspective: 1600 });
    const rx = gsap.quickTo(img, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(img, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 16); rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
    };
    const leave = () => { rx(0); ry(0); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, { scope: box });
  return <div className="pj-3d-tilt" ref={box}><img src={src} alt={alt} decoding="async" /></div>;
}

export default function Projects() {
  const images = useProjectImages();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mosaic = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const opening = useRef(false);
  const swapping = useRef(false);
  const [sel, setSel] = useState<number | null>(null);
  const viewer = useRef<HTMLDialogElement>(null);
  const [view3d, setView3d] = useState<string | null>(null); // area of the stage card whose 3D view is open
  const v3 = view3d ? CARD_STAGES[view3d] : undefined;
  const open3d = (area: string) => { document.documentElement.classList.add('pj-lock'); viewer.current!.showModal(); setView3d(area); };
  const close3d = () => { viewer.current?.close(); document.documentElement.classList.remove('pj-lock'); setView3d(null); };
  const total = projects.length;
  const p = projects[sel ?? 0];

  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({
      pinned: '(min-width: 901px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)',
      stacked: '(max-width: 900px), (max-height: 559px)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (ctx) => {
      const { pinned, reduce } = ctx.conditions as { pinned: boolean; stacked: boolean; reduce: boolean };
      if (reduce) return;
      const sec = root.current!, mos = mosaic.current!;
      const tiles = gsap.utils.toArray<HTMLElement>('.pj-tile', mos);
      const staged = tiles.filter((el) => el.classList.contains('pj-stages'));

      if (!pinned) {
        // Stacked layout: blocks tip up into place as they scroll into view.
        gsap.set(tiles, { opacity: 0, y: 60, rotationX: 18, transformPerspective: 1200 });
        ScrollTrigger.batch(tiles, {
          start: 'top 92%', once: true,
          onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
        });
        // Stage cards play their story while they cross the screen.
        staged.forEach((el) => gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 20%', scrub: 0.5 } }).add(stageTimeline(el)));
        return () => gsap.set(tiles, { clearProps: 'all' });
      }

      sec.classList.add('pj-pinned');

      // --pj-lead (screens, CSS): a lead-in at the top of the track before the grid starts. The paper story sets it to 1
      // (paper-story.css): the section is already pinned at the top while its label and grid slide in from the right, and the
      // track is one screen taller there. 0 everywhere else.
      const lead = () => (parseFloat(getComputedStyle(sec).getPropertyValue('--pj-lead')) || 0) * window.innerHeight;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track.current, start: () => `top+=${lead()} top`, end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true,
        },
      });
      staged.forEach((el) => tl.add(stageTimeline(el), STAGES_AT));
      tl.to({}, { duration: 0.3 });
      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        sec.classList.remove('pj-pinned');
      };
    });
    return () => mm.revert();
  }, { scope: root });

  // ---------- Project detail: the clicked block expands into a full panel with a 3D depth move ----------
  const reduced = () => prefersReducedMotion();

  const animateIn = contextSafe(() => {
    const pn = panel.current!, o = origin.current;
    const reveals = pn.querySelectorAll('.pj-reveal');
    if (reduced() || !o) { gsap.set(reveals, { opacity: 1, y: 0 }); return; }
    const a = o.getBoundingClientRect(), b = pn.getBoundingClientRect();
    gsap.fromTo(pn,
      { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, rotationX: 14, opacity: 1, transformOrigin: '0 0', transformPerspective: 1800 },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, rotationX: 0, duration: 0.85, ease: 'expo.inOut' });
    gsap.fromTo(reveals, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, delay: 0.45, ease: 'power3.out' });
    gsap.to(stage.current, { scale: 0.94, opacity: 0.35, duration: 0.85, ease: 'expo.inOut' });
  });

  const swapIn = contextSafe(() => {
    gsap.fromTo(panel.current!.querySelectorAll('.pj-reveal'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: 'power3.out' });
  });

  useLayoutEffect(() => {
    if (sel === null) return;
    if (opening.current) { opening.current = false; animateIn(); }
    else if (swapping.current) { swapping.current = false; swapIn(); }
  }, [sel, animateIn, swapIn]);

  const openProject = (i: number, el: HTMLElement) => {
    origin.current = el;
    opening.current = true;
    document.documentElement.classList.add('pj-lock');
    dialog.current!.showModal();
    setSel(i);
  };

  const closeProject = contextSafe(() => new Promise<void>((resolve) => {
    const d = dialog.current!, pn = panel.current!, o = origin.current;
    const finish = () => {
      gsap.set(pn, { clearProps: 'transform,opacity' });
      gsap.set(stage.current, { clearProps: 'transform,opacity' });
      d.close();
      document.documentElement.classList.remove('pj-lock');
      setSel(null);
      resolve();
    };
    if (!d.open) { resolve(); return; }
    if (reduced() || !o) { finish(); return; }
    const a = o.getBoundingClientRect(), b = pn.getBoundingClientRect();
    gsap.to(pn.querySelectorAll('.pj-reveal'), { opacity: 0, duration: 0.2 });
    gsap.to(pn, { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, rotationX: 14, transformOrigin: '0 0', transformPerspective: 1800, duration: 0.6, ease: 'expo.inOut', onComplete: finish });
    gsap.to(pn, { opacity: 0, duration: 0.2, delay: 0.42 });
    gsap.to(stage.current, { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.inOut' });
  }));

  const step = contextSafe((dir: number) => {
    if (sel === null) return;
    const j = (sel + dir + total) % total;
    origin.current = root.current!.querySelector<HTMLElement>(`.pj-face[data-i="${j}"]`);
    if (reduced()) { setSel(j); return; }
    gsap.to(panel.current!.querySelectorAll('.pj-reveal'), { opacity: 0, y: -10, duration: 0.2, onComplete: () => { swapping.current = true; setSel(j); } });
  });

  const arrow = <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 12L12 4M6 4h6v6" /></svg>;

  return (
    <section id="projects" className="work gut" ref={root} aria-labelledby="pj-title">
      <div className="pj-track" ref={track}>
        <div className="pj-pin">
          <div className="pj-head">
            <h2 className="eyebrow sec-label" id="pj-title">Featured projects</h2>
          </div>
          <div className="pj-stage" ref={stage}>
            <div className="pj-mosaic" ref={mosaic}>
              {TILES.map((t) => (
                <div key={t.area} className={`pj-tile pj-${t.area} pj-tone-${t.tone}${t.kind === 'stages' ? ' pj-stages' : ''}`} data-z={t.z}>
                  {t.kind === 'stages' && CARD_STAGES[t.area] && (() => {
                    const s = CARD_STAGES[t.area]!;
                    return <>
                      <div className="pj-st-card" style={{ ['--paper' as string]: s.paper }}>
                        <img className="pj-st-img pj-st-blue" src={s.blueprint} alt={s.alt.blueprint} loading="lazy" decoding="async" />
                        <img className="pj-st-img pj-st-render" src={s.render} alt={s.alt.render} loading="lazy" decoding="async" />
                      </div>
                      <button type="button" className="pj-st-model" onClick={() => open3d(t.area)} aria-haspopup="dialog"
                        aria-label={s.name ? `${s.name}: open the interactive 3D view` : 'Open the interactive 3D view'}>
                        <img src={s.model} alt={s.alt.model} loading="lazy" decoding="async" />
                      </button>
                      {s.name && <span className="pj-st-name">{s.name}</span>}
                    </>;
                  })()}
                  {t.kind === 'project' && (
                    <button type="button" className="pj-face pj-photo" data-i={t.i} aria-haspopup="dialog" onClick={(e) => openProject(t.i, e.currentTarget)}>
                      <span className={`pj-t-art${t.img?.contain ? ' pj-t-contain' : ''}${t.img || images[t.i] ? '' : ' img-wait'}`}>
                        {t.img ? <img src={t.img.src} alt={t.img.alt} loading="lazy" decoding="async" />
                          : images[t.i] && <img src={images[t.i]!} alt={projects[t.i].image ? projects[t.i].name : `Rendering of ${projects[t.i].name}`} loading="lazy" decoding="async" />}
                      </span>
                      <span className="pj-shade" aria-hidden="true" />
                      <span className="pj-t-head">
                        <span className="pj-t-sub">{pad(t.i + 1)}</span>
                        <span className="pj-t-title">{projects[t.i].name}</span>
                      </span>
                      <span className="pj-open" aria-hidden="true">{arrow}</span>
                    </button>
                  )}
                  {t.kind === 'plan' && (
                    <NavLink to="plan" className="pj-face">
                      <span className="pj-t-head"><span className="pj-t-title">Walk the plan</span>
                        <span className="pj-t-sub">Explore the interactive villa</span></span>
                      <svg className="pj-t-plan" viewBox="0 0 120 150" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <rect x="6" y="6" width="108" height="138" rx="2" />
                        <path d="M6 62H70V6M70 40h44M44 62v82M44 104h70M86 104v40" />
                        <path d="M70 62a14 14 0 0 1 14-14M44 82a12 12 0 0 0-12 12" strokeDasharray="2 3" />
                        <circle cx="95" cy="80" r="3.5" fill="currentColor" stroke="none" />
                      </svg>
                      <span className="pj-open" aria-hidden="true">{arrow}</span>
                    </NavLink>
                  )}
                  {t.kind === 'contact' && (
                    <NavLink to="contact" className="pj-face">
                      <span className="pj-t-head">
                        <span className="pj-t-title">Start a project</span>
                        <span className="pj-t-sub">Tell us about your plot</span>
                      </span>
                      <span className="pj-open" aria-hidden="true">{arrow}</span>
                    </NavLink>
                  )}
                  {t.kind === 'brand' && (
                    <div className="pj-face pj-brand"><Logo id="pjlogo" /></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <dialog className="pj-3d" ref={viewer} aria-labelledby="pj-3d-title"
        onCancel={(e) => { e.preventDefault(); close3d(); }}
        onClick={(e) => { if (e.target === e.currentTarget) close3d(); }}>
        {v3 && (
          <div className="pj-3d-box">
            <p className="eyebrow pj-3d-title" id="pj-3d-title">{v3.name ? `${v3.name} · 3D view` : '3D view'}</p>
            <div className="pj-3d-stage">
              {v3.model3d ? <ModelViewer model={v3.model3d} reduced={prefersReducedMotion()} /> : <ModelTilt src={v3.model} alt={v3.alt.model} />}
            </div>
            <p className="pj-3d-hint">{v3.model3d ? 'Drag to turn · Scroll to zoom' : 'Move the pointer to tilt'}</p>
            <button type="button" className="pj-close" onClick={close3d} aria-label="Close 3D view">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
            </button>
          </div>
        )}
      </dialog>

      <dialog className="pj-modal" ref={dialog} aria-labelledby="pj-modal-title"
        onCancel={(e) => { e.preventDefault(); closeProject(); }}
        onClick={(e) => { if (e.target === e.currentTarget) closeProject(); }}>
        <div className="pj-panel" ref={panel}>
          <div className={`pj-panel-media${images[sel ?? 0] ? '' : ' img-wait'}`}>
            {sel !== null && images[sel] && <img src={images[sel]!} alt={p.image ? p.name : `Rendering of ${p.name}`} decoding="async" />}
          </div>
          <div className="pj-panel-copy">
            <p className="eyebrow on-dark pj-reveal">{pad((sel ?? 0) + 1)} / {pad(total)}</p>
            <h3 id="pj-modal-title" className="pj-reveal">{p.name}</h3>
            <dl className="pj-reveal">
              <dt>Type</dt><dd>{p.type}</dd>
              <dt>Location</dt><dd className={p.location.startsWith('[') ? 'ph' : undefined}>{p.location}</dd>
            </dl>
            <p className="pj-reveal">{p.text}</p>
            {p.plan && (
              <div className="pj-reveal">
                <NavLink to="plan" className="btn-line" before={closeProject}>
                  Walk the plan <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" /></svg>
                </NavLink>
              </div>
            )}
            <div className="pj-panel-nav pj-reveal">
              <button type="button" onClick={() => step(-1)} aria-label="Previous project">
                <svg viewBox="0 0 40 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M40 8H2M9 1L2 8l7 7" /></svg>
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next project">
                <svg viewBox="0 0 40 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M0 8h38M31 1l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          <button type="button" className="pj-close" onClick={() => closeProject()} aria-label="Close project">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>
      </dialog>
    </section>
  );
}
