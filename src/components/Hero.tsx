'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import NavLink from './NavLink';
import { heroScene } from '@/data/projects';
import { TOD } from '@/lib/three/scenes';
import { hasWebGL, prefersReducedMotion } from '@/lib/dom';

const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

export default function Hero() {
  const frame = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState<{ webgl: boolean; reduced: boolean } | null>(null);
  const [visible, setVisible] = useState(true);
  const t = TOD[heroScene.tod];

  useEffect(() => {
    setReady({ webgl: hasWebGL(), reduced: prefersReducedMotion() });
    const el = frame.current!;
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

  return (
    <section id="home" className="hero gut">
      <div className="hero-frame" ref={frame}>
        {ready?.webgl && <HeroScene scene={heroScene.scene} tod={heroScene.tod} pointer={pointer} active={visible} reduced={ready.reduced} />}
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">Sunfold Villa</p>
          <h1>Architecture shaped by light</h1>
          <NavLink to="plan" className="link-under">Explore the villa</NavLink>
        </div>
        <div className="hero-meta">
          <span>Sun altitude <b>{t.el}°</b> · Azimuth <b>{t.az}°</b></span>
          <span className="hide-sm">Baldwa · Architecture &amp; Interiors</span>
        </div>
        <div className="scroll-cue" aria-hidden="true" />
      </div>
    </section>
  );
}
