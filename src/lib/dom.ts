import { useEffect, useState } from 'react';

// Small browser helpers. Only call the non-hook helpers from effects or event handlers (not during render).

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Matches the 900px breakpoint in src/styles/responsive.css
export const isDesktop = () => typeof window !== 'undefined' && window.innerWidth > 900;

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// Heavy below-the-fold sections use this to delay animation and canvas setup until the visitor is
// close enough to see them. It stays true after the first intersection so scrolling back is instant.
export function useNearViewport<T extends Element>(ref: { readonly current: T | null }, rootMargin = '800px') {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNear(true);
      io.disconnect();
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return near;
}

// Smooth-scroll to a section id ('home' = top) and keep the URL hash in sync.
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = id === 'home' ? 0 : el.getBoundingClientRect().top + window.scrollY - (id === 'plan' ? 20 : 0);
  window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  history.replaceState(null, '', id === 'home' ? location.pathname : `#${id}`);
}
