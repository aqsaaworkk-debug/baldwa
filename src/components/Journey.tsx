'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { hasWebGL, prefersReducedMotion } from '@/lib/dom';
import { createCloudReveal } from '@/lib/journey/cloudReveal2d';
import { CHAPTERS, SCREENS, journey, lerp, pickQuality, range, smooth, stageT, type Quality } from '@/lib/journey/stages';
import { BRAND, HOME } from '@/data/site';
import { CLIPS, DRONE, FILM_CHAPTERS, FILM_SCREENS, HERO_FILM, JOIN, PART, clipTimes, droneAt, filmAt, filmT } from '@/lib/journey/film';

// Opening scroll journey. A tall section with a sticky stage; one scrubbed ScrollTrigger
// writes the master progress (journey.p) and everything else follows from that number.
//
// Ways to show it:
//   film  (USE_FILM) the client's two clips scrubbed by scroll under the photo clouds (lib/journey/film.ts)
//   3d    real-time scene (three/JourneyScene), the photo clouds part over it
//   2d    no WebGL: the cloud photo parts over a still of the site
//   still reduced motion: one screen, a still, no scroll effects
const USE_FILM = true; // false brings back the real-time 3D journey, untouched
const SINGLE = USE_FILM && HERO_FILM !== null; // the client's one hero film replaces the two clips (film.ts)

const JourneyScene = dynamic(() => import('./three/JourneyScene'), { ssr: false });

const IMG = '/images/journey';
const FADE = .035; // caption fade length, in master progress

type Chapter = { id: string; label: string; kicker: string; title: string; detail: string; show: readonly number[]; goto: number };
const chapters: readonly Chapter[] = SINGLE ? [] : USE_FILM ? FILM_CHAPTERS : CHAPTERS;

// Photo clouds of the hero: cloud banks (cloud-bank.webp, cut out of the client's cloud-on-black
// image) in front of a dense cloud deck. They drift in when the intro curtain lifts and part on scroll.
// x / y: centre, in % of the stage. w: width, in units of max(1vw, 1.6vh), so portrait screens
// stay covered. to: where it travels while parting (xPercent / yPercent of its own size) and
// how much it grows, as if the camera flies through. at: stagger inside the parting (0 → 1).
const PUFFS = [
  { x: 50, y: 18, w: 150, flip: false, to: [0, -60, 1.6],  at: [.05, .8] },  // high bank
  { x: 8,  y: 62, w: 125, flip: true,  to: [-80, 10, 1.7], at: [.12, .9] },  // left
  { x: 94, y: 58, w: 125, flip: false, to: [80, 5, 1.7],   at: [.1, .88] },  // right
  { x: 50, y: 88, w: 175, flip: false, to: [0, 50, 2.4],   at: [0, .7] },    // front, right under the camera
] as const;

// Seeks a paused video to a target time, one seek at a time (asking again while the decoder is
// busy only queues work); when a seek lands and the target has moved on, it seeks again.
function scrubber(v: HTMLVideoElement) {
  let target = 0;
  const go = () => {
    if (v.readyState >= 1 && !v.seeking && Math.abs(v.currentTime - target) > 1 / 60) v.currentTime = target;
  };
  v.addEventListener('seeked', go);
  v.addEventListener('loadedmetadata', go);
  return { set(t: number) { target = t; go(); }, destroy() { v.removeEventListener('seeked', go); v.removeEventListener('loadedmetadata', go); } };
}

export default function Journey() {
  const root = useRef<HTMLElement>(null);
  const canvas2d = useRef<HTMLCanvasElement>(null);
  const clipA = useRef<HTMLVideoElement>(null);
  const clipB = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'film' | '3d' | '2d' | 'still' | null>(null);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [visible, setVisible] = useState(true);
  const live = mode === 'film' || mode === '3d' || mode === '2d';

  useEffect(() => {
    if (prefersReducedMotion()) { setMode('still'); return; }
    if (USE_FILM) setMode('film');
    else {
      const webgl = hasWebGL();
      if (webgl) setQuality(pickQuality());
      setMode(webgl ? '3d' : '2d');
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(root.current!);
    return () => io.disconnect();
  }, []);

  useGSAP(() => {
    if (!live || !root.current) return;
    const film = mode === 'film';
    const $ = gsap.utils.selector(root);
    const captions = $('.journey-caption');
    const puffs = $('.sky-puff'), deck = $('.sky-deck'), land = $('.sky-land'), sky = $('.journey-sky');

    // Ambient life, separate from scroll: each bank floats slowly (inner image) and the banks
    // drift in (middle wrapper) as the intro curtain lifts. Neither touches the scroll-driven outer element.
    const floats = $('.sky-puff img').map((img, i) => {
      gsap.set(img, { scaleX: PUFFS[i].flip ? -1 : 1 });
      return gsap.to(img, { x: i % 2 ? -26 : 26, y: i % 2 ? 8 : -8, duration: 7 + i * 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
    const enter = gsap.timeline({ paused: true });
    if (film) enter.from($('.film-title-in'), { opacity: 0, y: 34, duration: 1.4, ease: 'expo.out', stagger: .12 }, .5);
    else enter
      .from($('.sky-in'), { opacity: 0, scale: 1.18, y: 70, duration: 2.2, ease: 'power3.out', stagger: { each: .12, from: 'end' } })
      .from(deck, { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0);
    const html = document.documentElement;
    let mo: MutationObserver | null = null;
    if (html.classList.contains('intro-on')) {
      mo = new MutationObserver(() => {
        if (html.classList.contains('intro-on')) return;
        mo?.disconnect(); mo = null; enter.play();
      });
      mo.observe(html, { attributes: true, attributeFilter: ['class'] });
    } else enter.progress(1);

    // film: two scrubbed clips. B starts loading once A has its first frames.
    const a = film && clipA.current ? scrubber(clipA.current) : null;
    const b = film && clipB.current ? scrubber(clipB.current) : null;
    const loadB = () => { const v = clipB.current; if (v && v.preload !== 'auto') { v.preload = 'auto'; v.load(); } };
    clipA.current?.addEventListener('canplaythrough', loadB, { once: true });
    const onMeta = () => apply();
    if (SINGLE) clipA.current?.addEventListener('loadedmetadata', onMeta);
    // iOS only paints a seeked frame after the video has played once: do that on the first touch
    const unlock = () => [clipA.current, clipB.current].forEach((v) => v?.play().then(() => v.pause()).catch(() => {}));
    if (film) window.addEventListener('touchstart', unlock, { once: true, passive: true });

    const reveal = mode === '2d' && canvas2d.current
      ? createCloudReveal(canvas2d.current, { sky: `${IMG}/sky.webp`, land: `${IMG}/site.webp` }) : null;
    const ro = reveal && canvas2d.current ? new ResizeObserver(() => reveal.resize()) : null;
    if (ro && canvas2d.current) ro.observe(canvas2d.current);

    const setPuffs = (open: number, near: number) => PUFFS.forEach((c, i) => {
      const t = smooth(range(open, c.at[0], c.at[1]));
      gsap.set(puffs[i], {
        xPercent: -50 + c.to[0] * t, yPercent: -50 + c.to[1] * t,
        scale: (1 + .08 * near) * lerp(1, c.to[2], t), opacity: 1 - range(t, .35, .9),
      });
    });

    // Everything on the HTML side, as a function of the master progress.
    // (The logo is not part of it: the preloader in Intro.tsx puts it in the header.)
    const apply = () => {
      const p = journey.p;
      if (SINGLE) {
        // one film across the whole opening; the title leaves over the first stretch of scroll
        const title = 1 - smooth(range(p, 0, .14));
        gsap.set($('.journey-cue'), { opacity: title });
        gsap.set($('.film-title'), { autoAlpha: title, y: -40 * (1 - title) });
        gsap.set($('.film-scrim'), { autoAlpha: .35 + .65 * title });
        const d = clipA.current?.duration ?? 0;
        a?.set(Number.isFinite(d) ? Math.min(p, .998) * d : 0);
        return;
      }
      const intro = 1 - range(film ? filmT('hero', p) : stageT('logo', p), 0, .5);
      gsap.set($('.journey-cue'), { opacity: intro, y: -16 * (1 - intro) });
      chapters.forEach((c, i) => {
        const o = Math.min(range(p, c.show[0], c.show[0] + FADE), 1 - range(p, c.show[1], c.show[1] + FADE));
        gsap.set(captions[i], { opacity: o, y: 14 * (1 - o) });
      });

      if (film) {
        const part = filmT('part', p), drone = filmT('drone', p), site = filmT('site', p);
        // the hero title leaves first, while clip A runs its own cloud dispersal (no photo clouds on top)
        const title = 1 - smooth(range(part, PART.title[0], PART.title[1]));
        gsap.set($('.film-title'), { autoAlpha: title, y: -40 * (1 - title) });
        gsap.set($('.film-scrim'), { autoAlpha: title });
        // drone glide over the land; at its end the camera pushes in and clip B dissolves in over
        // clip A (no cloud in between), then settles forward
        const t = clipTimes(p);
        gsap.set(clipA.current, { ...droneAt(p), transformOrigin: DRONE.origin, autoAlpha: site > JOIN.clear[1] ? 0 : 1 });
        gsap.set(clipB.current, { scale: lerp(1.22, 1, 1 - Math.pow(1 - range(site, JOIN.settle[0], JOIN.settle[1]), 3)), autoAlpha: smooth(range(drone, JOIN.cover[0], JOIN.cover[1])) });
        a?.set(t.a);
        b?.set(t.b);
        return;
      }

      reveal?.setProgress(smooth(stageT('reveal', p)));
      // photo clouds over the 3D scene: push in towards the deck, part, then hand over to the scene
      const near = .35 * stageT('logo', p) + .65 * stageT('clouds', p); // 0 → 1 before the reveal
      const open = stageT('reveal', p), out = stageT('site', p);
      setPuffs(open, near);
      gsap.set(deck, { scale: 1 + .1 * near + .08 * smooth(open), opacity: 1 - smooth(range(open, .2, .75)) });
      gsap.set(land, { scale: lerp(1.16, 1.04, smooth(open)) * lerp(1, 1.22, smooth(range(out, 0, .3))) });
      gsap.set(sky, { autoAlpha: 1 - smooth(range(out, .04, .3)) });
    };

    journey.p = 0;
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __journey?: typeof journey }).__journey = journey; // for scroll tests
    gsap.to(journey, {
      p: 1, ease: 'none', onUpdate: apply,
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: .6, onRefresh: apply },
    });
    apply();

    return () => {
      ro?.disconnect(); reveal?.destroy(); mo?.disconnect();
      a?.destroy(); b?.destroy();
      clipA.current?.removeEventListener('canplaythrough', loadB);
      clipA.current?.removeEventListener('loadedmetadata', onMeta);
      window.removeEventListener('touchstart', unlock);
      floats.forEach((f) => f.kill()); enter.kill();
      journey.p = 0;
    };
  }, { scope: root, dependencies: [mode] });

  return (
    <section
      id="home" ref={root} aria-label="From vision to reality"
      className={`journey${live ? ' journey--live' : ''}${mode === 'film' ? ' journey--film' : ''}`}
      style={{ '--journey-screens': HERO_FILM && SINGLE ? HERO_FILM.screens : USE_FILM ? FILM_SCREENS : SCREENS } as CSSProperties}
    >
      <div className="journey-stage">
        {mode === '3d' && quality && <JourneyScene quality={quality} active={visible} />}
        {mode === '2d' && <canvas ref={canvas2d} role="img" aria-label="Clouds parting above an empty plot in a green neighbourhood" />}
        {mode === 'film' && HERO_FILM && SINGLE && (
          <video className="film-clip" ref={clipA} src={HERO_FILM.src} muted playsInline preload="auto" aria-hidden="true" />
        )}
        {mode === 'film' && !SINGLE && <>
          <video className="film-clip" ref={clipA} src={CLIPS.a.src} muted playsInline preload="auto" aria-hidden="true" />
          <video className="film-clip" ref={clipB} src={CLIPS.b.src} muted playsInline preload="none" role="img"
            aria-label="An empty plot beside a road; the founder walks onto it and the outline of the building rises" />
        </>}
        {/* eslint-disable @next/next/no-img-element */}
        {mode === 'still' && (USE_FILM
          ? <img className="journey-still" src={`${IMG}/plot.webp`} alt="An empty plot beside a road, with houses and trees around it" />
          : <img className="journey-still" src={`${IMG}/site.webp`} alt="A wide, empty plot beside a road in a green neighbourhood, seen from above" />)}
        {live && mode !== 'film' && (
          <div className="journey-sky" aria-hidden="true">
            <img className="sky-land" src={`${IMG}/land.webp`} alt="" />
            <img className="sky-deck" src={`${IMG}/cloud-deck.webp`} alt="" />
            {PUFFS.map((c, i) => (
              <div className="sky-puff" key={i} style={{ left: `${c.x}%`, top: `${c.y}%`, '--w': c.w } as CSSProperties}>
                <div className="sky-in"><img src={`${IMG}/cloud-bank.webp`} alt="" /></div>
              </div>
            ))}
          </div>
        )}
        {/* eslint-enable @next/next/no-img-element */}
        {mode === 'film' && <>
          <div className="film-scrim" aria-hidden="true" />
          {/* hero title (the page's H1 from the SEO brief): large type on the left, small spaced line under it */}
          <div className="film-title">
            <h1 className="film-title-in">{HOME.h1}</h1>
            <p className="film-title-in">{BRAND.name} · Architecture · BIM engineering · Interior design</p>
          </div>
        </>}
        {/* the bottom of the opening melts into the page canvas */}
        <div className="journey-fade" aria-hidden="true" />
        <p className="journey-cue" aria-hidden="true">Scroll to begin</p>
        {chapters.map((c) => (
          <div className="journey-caption" key={c.id} data-chapter={c.id}>
            <p className="journey-kicker">{c.kicker}</p>
            <p className="journey-title">{c.title}</p>
            <p>{c.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
