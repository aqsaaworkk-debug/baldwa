'use client';
import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { hasWebGL, prefersReducedMotion } from '@/lib/dom';
import { projects } from '@/data/projects';
import { useProjectImages } from './ProjectImages';
import NavLink from './NavLink';
import Logo from './Logo';

const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

// Live 3D building in the hero tile (the page hero above shows Sunfold, so this one differs).
const HERO = { scene: 'pavilion', tod: 'dusk', index: 0 } as const; // index = photo shown if WebGL is unavailable

// Bento mosaic. The hero card starts full screen, then shrinks toward the centre and fades away
// while these tiles fill the whole grid.
// area = grid-template-areas name in projects.css · tone = background from the brand palette · z = resting depth (px)
type Tile =
  | { area: string; tone: string; z: number; kind: 'project'; i: number }
  | { area: string; tone: string; z: number; kind: 'brand' | 'plan' | 'contact' };
const TILES: Tile[] = [
  { area: 'a', tone: 'white', z: 10, kind: 'project', i: 1 },
  { area: 'b', tone: 'paper', z: 28, kind: 'project', i: 0 },
  { area: 'c', tone: 'stone', z: 30, kind: 'project', i: 3 },
  { area: 'd', tone: 'white', z: 18, kind: 'project', i: 4 },
  { area: 'e', tone: 'stone', z: 24, kind: 'contact' },
  { area: 'f', tone: 'white', z: 40, kind: 'brand' },
  { area: 'g', tone: 'paper', z: 6, kind: 'project', i: 5 },
  { area: 'h', tone: 'paper', z: 14, kind: 'project', i: 2 },
  { area: 'i', tone: 'night', z: 22, kind: 'plan' },
];
const HERO_Z = 50;

/* eslint-disable @next/next/no-img-element */
export default function Projects() {
  const images = useProjectImages();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mosaic = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const heroInner = useRef<HTMLDivElement>(null);
  const heroMedia = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const origin = useRef<HTMLElement | null>(null);
  const opening = useRef(false);
  const swapping = useRef(false);
  const [sel, setSel] = useState<number | null>(null);
  const [env, setEnv] = useState<{ webgl: boolean; reduced: boolean } | null>(null);
  const [visible, setVisible] = useState(false);
  const total = projects.length;
  const p = projects[sel ?? 0];

  // WebGL check, pause the 3D tile when off screen, and feed the pointer to its camera.
  useEffect(() => {
    setEnv({ webgl: hasWebGL(), reduced: prefersReducedMotion() });
    const el = hero.current!;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current = { x: (e.clientX - r.left) / r.width - .5, y: (e.clientY - r.top) / r.height - .5 };
    };
    const leave = () => { pointer.current = { x: 0, y: 0 }; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { io.disconnect(); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);

  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({
      pinned: '(min-width: 1101px) and (min-height: 641px)',
      any: '(min-width: 0px)', // ensures the handler always runs
      reduce: '(prefers-reduced-motion: reduce)',
      hover: '(hover: hover) and (pointer: fine)',
    }, (ctx) => {
      const { pinned, reduce, hover } = ctx.conditions as { pinned: boolean; reduce: boolean; hover: boolean };
      const sec = root.current!, heroEl = hero.current!, mos = mosaic.current!, media = heroMedia.current!;
      const tiles = gsap.utils.toArray<HTMLElement>('.pj-tile');
      const offs: (() => void)[] = [];

      if (pinned && !reduce) {
        sec.classList.add('pj-pinned');
        const head = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head')) || 76;
        const box = () => ({ w: mos.clientWidth, h: mos.clientHeight });
        // Where the hero shrinks to before it vanishes: a small card in the centre of the grid.
        const target = () => { const { w, h } = box(), tw = w * 0.3, th = h * 0.3; return { l: (w - tw) / 2, t: (h - th) / 2, w: tw, h: th }; };

        // The live 3D canvas keeps the full-screen size and is only scaled, so it never re-allocates while shrinking.
        const fitMedia = () => {
          const { w, h } = box();
          media.style.width = `${w}px`; media.style.height = `${h}px`;
          const s = Math.max(heroEl.offsetWidth / w, heroEl.offsetHeight / h);
          gsap.set(media, { xPercent: -50, yPercent: -50, scale: s });
        };
        gsap.set(heroEl, { z: HERO_Z });

        // Every tile starts deep behind the hero, pushed outward from the centre.
        const hidden = (el: HTMLElement) => {
          const t = target();
          const dx = el.offsetLeft + el.offsetWidth / 2 - (t.l + t.w / 2);
          const dy = el.offsetTop + el.offsetHeight / 2 - (t.t + t.h / 2);
          return { opacity: 0, x: dx * 0.55, y: dy * 0.55, z: -760, rotationY: gsap.utils.clamp(-40, 40, -dx / 18), rotationX: gsap.utils.clamp(-30, 30, dy / 14) };
        };
        tiles.forEach((el) => gsap.set(el, hidden(el)));

        const tl = gsap.timeline({
          scrollTrigger: { trigger: track.current, start: () => `top top+=${head()}`, end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true, onRefresh: fitMedia },
        });
        // Hero shrinks toward the centre, then fades out completely (autoAlpha also hides it from clicks).
        tl.fromTo(heroEl,
          { left: 0, top: 0, width: () => box().w, height: () => box().h, borderRadius: 26 },
          { left: () => target().l, top: () => target().t, width: () => target().w, height: () => target().h, borderRadius: 16, duration: 0.9, ease: 'power2.inOut', onUpdate: fitMedia }, 0)
          .to(heroEl.querySelectorAll('.pj-fade'), { opacity: 0, duration: 0.3 }, 0)
          .fromTo(heroEl, { autoAlpha: 1 }, { autoAlpha: 0, z: HERO_Z - 260, duration: 0.35, ease: 'power1.in', immediateRender: false }, 0.6);
        // Nearest tiles land first, the far corners last.
        const order = tiles
          .map((el) => { const t = target(); return { el, d: Math.hypot(el.offsetLeft - t.l, el.offsetTop - t.t) }; })
          .sort((a, b) => a.d - b.d);
        order.forEach(({ el }, k) => {
          tl.fromTo(el, { ...hidden(el), immediateRender: false },
            { opacity: 1, x: 0, y: 0, z: Number(el.dataset.z) || 0, rotationX: 0, rotationY: 0, duration: 0.7, ease: 'power3.out' }, 0.22 + k * 0.07);
        });
        tl.to({}, { duration: 0.3 });
        fitMedia();
        requestAnimationFrame(() => ScrollTrigger.refresh());
        offs.push(() => { gsap.set([heroEl, media], { clearProps: 'all' }); media.style.width = ''; media.style.height = ''; });
      } else if (!reduce) {
        // Stacked layout: tiles tip up into place as they scroll into view.
        gsap.set(tiles, { opacity: 0, y: 60, rotationX: 18, transformPerspective: 1200 });
        ScrollTrigger.batch(tiles, {
          start: 'top 92%', once: true,
          onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
        });
      }

      if (hover && !reduce) {
        // Depth parallax: the whole mosaic tilts with the pointer, so tiles on different depth layers shift apart.
        if (pinned) {
          const st = stage.current!;
          const mx = gsap.quickTo(mos, 'rotationY', { duration: 1.1, ease: 'power3.out' });
          const my = gsap.quickTo(mos, 'rotationX', { duration: 1.1, ease: 'power3.out' });
          const sMove = (e: PointerEvent) => {
            const r = st.getBoundingClientRect();
            mx(((e.clientX - r.left) / r.width - .5) * 7); my(-((e.clientY - r.top) / r.height - .5) * 5);
          };
          const sLeave = () => { mx(0); my(0); };
          st.addEventListener('pointermove', sMove);
          st.addEventListener('pointerleave', sLeave);
          offs.push(() => { st.removeEventListener('pointermove', sMove); st.removeEventListener('pointerleave', sLeave); gsap.set(mos, { clearProps: 'transform' }); });
        }

        // Hero tile leans toward the pointer.
        const inner = heroInner.current!;
        gsap.set(inner, { transformPerspective: 1400 });
        const hx = gsap.quickTo(inner, 'rotationY', { duration: 0.9, ease: 'power3.out' });
        const hy = gsap.quickTo(inner, 'rotationX', { duration: 0.9, ease: 'power3.out' });
        const hMove = (e: PointerEvent) => {
          const r = heroEl.getBoundingClientRect();
          hx(((e.clientX - r.left) / r.width - .5) * 6); hy(-((e.clientY - r.top) / r.height - .5) * 5);
        };
        const hLeave = () => { hx(0); hy(0); };
        heroEl.addEventListener('pointermove', hMove);
        heroEl.addEventListener('pointerleave', hLeave);
        offs.push(() => { heroEl.removeEventListener('pointermove', hMove); heroEl.removeEventListener('pointerleave', hLeave); });

        // Tiles: lift toward the viewer, tilt to the cursor, and move the specular light (CSS vars) under it.
        const fx = new Map<HTMLElement, gsap.QuickToFunc[]>();
        gsap.utils.toArray<HTMLElement>('.pj-face').forEach((f) => {
          gsap.set(f, { transformPerspective: 900 });
          fx.set(f, [
            gsap.quickTo(f, 'rotationY', { duration: 0.6, ease: 'power3.out' }),
            gsap.quickTo(f, 'rotationX', { duration: 0.6, ease: 'power3.out' }),
            gsap.quickTo(f, 'z', { duration: 0.6, ease: 'power3.out' }),
          ]);
        });
        
        const fMove = (e: PointerEvent) => {
          const f = (e.target as HTMLElement).closest<HTMLElement>('.pj-face');
          if (!f || !fx.has(f)) return;
          const r = f.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
          f.style.setProperty('--mx', `${x}px`);
          f.style.setProperty('--my', `${y}px`);
          f.style.setProperty('--px', `${(x / r.width - .5) * 2}`);
          f.style.setProperty('--py', `${(y / r.height - .5) * 2}`);
          f.style.setProperty('--ang', `${Math.atan2(y - r.height / 2, x - r.width / 2) * (180 / Math.PI) + 90}deg`);
          const [ry, rx, z] = fx.get(f)!;
          ry((x / r.width - .5) * 10); rx(-(y / r.height - .5) * 9); z(36);
        };
        const fOut = (e: PointerEvent) => {
          const f = (e.target as HTMLElement).closest<HTMLElement>('.pj-face');
          if (!f || !fx.has(f) || f.contains(e.relatedTarget as Node)) return;
          const [ry, rx, z] = fx.get(f)!;
          ry(0); rx(0); z(0);
          f.style.setProperty('--px', '0'); f.style.setProperty('--py', '0');
        };
        mos.addEventListener('pointermove', fMove);
        mos.addEventListener('pointerout', fOut);
        offs.push(() => { mos.removeEventListener('pointermove', fMove); mos.removeEventListener('pointerout', fOut); });
      }

      return () => { sec.classList.remove('pj-pinned'); offs.forEach((f) => f()); };
    });
    return () => mm.revert();
  }, { scope: root });

  // ---------- Project detail: the clicked tile expands into a full panel with a 3D depth move ----------
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
    <section id="projects" className="work gut" ref={root}>
      <div className="pj-track" ref={track}>
        <div className="pj-pin">
          <div className="pj-stage" ref={stage}>
            <div className="pj-mosaic" ref={mosaic}>
              {/* Hero card: full screen at first, then shrinks to the centre and fades away. */}
              <article className="pj-hero" ref={hero} aria-labelledby="pj-title">
                <div className="pj-hero-inner" ref={heroInner}>
                  <div className={`pj-hero-media${env?.webgl || images[HERO.index] ? '' : ' img-wait'}`} ref={heroMedia}>
                    {env?.webgl
                      ? <HeroScene scene={HERO.scene} tod={HERO.tod} pointer={pointer} active={visible && sel === null} reduced={env.reduced} label="Live 3D model of a pavilion at dusk" />
                      : images[HERO.index] && <img src={images[HERO.index]!} alt={projects[HERO.index].name} />}
                  </div>
                  <div className="pj-hero-shade" />
                  <div className="pj-hero-copy">
                    <p className="eyebrow on-dark pj-fade">Featured projects</p>
                    <h2 id="pj-title">Places we have <em>shaped</em></h2>
                    <p className="lede on-dark pj-fade">Homes, pavilions and workplaces planned around sun, shade and the way people actually live in them.</p>
                  </div>
                  <span className="pj-hint pj-fade" aria-hidden="true">Scroll to explore</span>
                </div>
              </article>

              {TILES.map((t) => (
                <div key={t.area} className={`pj-tile pj-${t.area} pj-tone-${t.tone}`} data-z={t.z}>
                  {t.kind === 'project' && (
                    <button type="button" className="pj-face" data-i={t.i} aria-haspopup="dialog" onClick={(e) => openProject(t.i, e.currentTarget)}>
                      <span className="pj-t-head"><span className="pj-t-title">{projects[t.i].name}</span>
                      <span className="pj-t-sub">{String(t.i + 1).padStart(2, '0')} · {projects[t.i].type}</span></span>
                      <span className={`pj-t-art${images[t.i] ? '' : ' img-wait'}`}>{images[t.i] && <img src={images[t.i]!} alt="" />}</span>
                      <span className="pj-edge" aria-hidden="true" />
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
                      <span className="pj-edge" aria-hidden="true" />
                      <span className="pj-open" aria-hidden="true">{arrow}</span>
                    </NavLink>
                  )}
                  {t.kind === 'contact' && (
                    <NavLink to="contact" className="pj-face">
                      <span className="pj-t-head">
                        <span className="pj-t-title">Start a project</span>
                        <span className="pj-t-sub">Tell us about your plot</span>
                      </span>
                      <svg className="pj-t-plan pj-t-sun" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M14 96H106" />
                        <path d="M30 96a30 30 0 0 1 60 0" />
                        <path d="M60 52V36M38 61L27 50M82 61l11-11M28 80H14M106 80H92" strokeLinecap="round" />
                      </svg>
                      <span className="pj-edge" aria-hidden="true" />
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

      <dialog className="pj-modal" ref={dialog} aria-labelledby="pj-modal-title"
        onCancel={(e) => { e.preventDefault(); closeProject(); }}
        onClick={(e) => { if (e.target === e.currentTarget) closeProject(); }}>
        <div className="pj-panel" ref={panel}>
          <div className={`pj-panel-media${images[sel ?? 0] ? '' : ' img-wait'}`}>
            {sel !== null && images[sel] && <img src={images[sel]!} alt={p.image ? p.name : `Rendering of ${p.name}`} />}
          </div>
          <div className="pj-panel-copy">
            <p className="eyebrow on-dark pj-reveal">{String((sel ?? 0) + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</p>
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
