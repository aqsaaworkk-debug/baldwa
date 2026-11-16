'use client';
import { useRef, useState, type FormEvent } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';

const TYPES = ['Residence', 'Villa', 'Interiors', 'Commercial', 'Other'];

type Note = { kind: 'ok' | 'err'; text: string } | null;

export default function Contact() {
  const [note, setNote] = useState<Note>(null);
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const stage = root.current?.querySelector<HTMLElement>('.enq-stage');
    const card = root.current?.querySelector<HTMLElement>('.enq-card');
    if (!stage || !card) return;

    // Fields pop in one after another when the card scrolls into view.
    gsap.from('.enq-pop', {
      y: 28, opacity: 0, scale: 0.94, duration: 0.7, stagger: 0.07, ease: 'back.out(1.7)',
      scrollTrigger: { trigger: card, start: 'top 82%', once: true },
    });

    // Shapes drift gently around the card.
    gsap.utils.toArray<HTMLElement>('.enq-shape').forEach((el, i) => {
      gsap.to(el, { y: i % 2 ? 18 : -22, rotation: i % 2 ? -14 : 16, duration: 3.2 + i * 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    // 3D tilt that follows the pointer (mouse only, so touch scrolling is unaffected).
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 9);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
    };
    const leave = () => { rx(0); ry(0); };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', leave);
    return () => {
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerleave', leave);
    };
  }, { scope: root });

  // Background: a ribbon of flowing parallel lines drawn on a canvas behind the card.
  useGSAP(() => {
    const canvas = root.current?.querySelector<HTMLCanvasElement>('.contact-waves');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const LINES = 24;
    const gold = getComputedStyle(canvas).getPropertyValue('--gold').trim() || '#f5b21a';
    let w = 0, h = 0, visible = true;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = gold;
      const amp = Math.min(h * 0.16, 150);
      const gap = Math.max(5, Math.min(w / 150, 9));
      for (let i = 0; i < LINES; i++) {
        const o = i - (LINES - 1) / 2;
        ctx.globalAlpha = 0.28 + 0.4 * (1 - Math.abs(o) / (LINES / 2));
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 12) {
          const u = x / w;
          // Centre line: two slow sines; the ribbon widens and pinches along its length.
          const mid = h * 0.52 + amp * Math.sin(u * 5.2 + t * 0.45) + amp * 0.45 * Math.sin(u * 2.3 - t * 0.3 + 1.4);
          const spread = 0.5 + 0.5 * Math.sin(u * 4.1 + t * 0.35 + 0.8);
          const y = mid + o * gap * (0.3 + 1.1 * spread);
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(gsap.ticker.time);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    if (prefersReducedMotion()) return () => ro.disconnect(); // static ribbon only

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const tick = (time: number) => { if (visible) draw(time); };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); io.disconnect(); ro.disconnect(); };
  }, { scope: root });

  // Validates but does NOT send yet. Connect it to a route handler (src/app/api/enquiry/route.ts)
  // or a form service (Formspree, Web3Forms, Resend…) at the TODO.
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!data.name?.trim() || !data.phone?.trim()) {
      setNote({ kind: 'err', text: 'Please add your name and phone number so we can reach you.' });
      (form.elements.namedItem(data.name?.trim() ? 'phone' : 'name') as HTMLInputElement).focus();
      return;
    }
    // TODO: await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    console.info('Enquiry (not sent yet):', data);
    setNote({ kind: 'ok', text: `Thank you, ${data.name.trim().split(' ')[0]}. This form is not connected yet, so please call the studio for now.` });
  };

  return (
    <section id="contact" className="contact gut" ref={root}>
      <canvas className="contact-waves" aria-hidden="true" />
      <div className="wrap contact-in">
        <div className="contact-head rv">
          <p className="eyebrow">Start a project</p>
          <h2>Bring us a plot and a <em>conversation</em></h2>
          <p className="lede">Tell us about the site and how you want to live.</p>
        </div>

        <div className="enq-stage rv">
          <span className="enq-shape s1" aria-hidden="true" />
          <span className="enq-shape s2" aria-hidden="true" />
          <span className="enq-shape s3" aria-hidden="true" />
          <span className="enq-shape s4" aria-hidden="true" />

          <form className="enq enq-card" onSubmit={onSubmit} noValidate>
            <div className="fld enq-pop"><label htmlFor="f-name">Your name</label><input id="f-name" name="name" autoComplete="name" required /></div>
            <div className="fld enq-pop"><label htmlFor="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autoComplete="tel" required /></div>
            <div className="fld full enq-pop">
              <span className="fld-l">Project type</span>
              <div className="chips" role="radiogroup" aria-label="Project type">
                {TYPES.map((t, i) => (
                  <span key={t}><input type="radio" name="type" id={`t${i}`} value={t} defaultChecked={i === 0} /><label htmlFor={`t${i}`}>{t}</label></span>
                ))}
              </div>
            </div>
            <div className="fld full enq-pop"><label htmlFor="f-loc">Plot location</label><input id="f-loc" name="location" /></div>
            <div className="fld full enq-pop"><label htmlFor="f-msg">About the project</label><textarea id="f-msg" name="message" rows={3} /></div>
            <div className="submit enq-pop">
              <button className="btn-pop" type="submit">Send enquiry <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" /></svg></button>
              <p className={`form-note${note ? ' ' + note.kind : ''}`} aria-live="polite">{note?.text}</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
