// Small browser helpers. Only call these from effects or event handlers (not during render).

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

// Smooth-scroll to a section id ('home' = top) and keep the URL hash in sync.
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = id === 'home' ? 0 : el.getBoundingClientRect().top + window.scrollY - (id === 'plan' ? 20 : 0);
  window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  history.replaceState(null, '', id === 'home' ? location.pathname : `#${id}`);
}
