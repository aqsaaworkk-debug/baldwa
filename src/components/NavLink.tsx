'use client';
import type { ReactNode, MouseEvent } from 'react';
import { scrollToSection } from '@/lib/dom';

// Link to a homepage section. On the homepage it smooth-scrolls to the section id; on any other page it goes to
// the homepage at that section. `before` runs first (e.g. close the menu) and may return a promise to wait for.
export default function NavLink({ to, className, children, label, before }: {
  to: string; className?: string; children: ReactNode; label?: string; before?: () => void | Promise<void>;
}) {
  const href = to === 'home' ? '/' : `/#${to}`;
  const onClick = async (e: MouseEvent) => {
    if (location.pathname !== '/') return; // normal navigation to the homepage section
    e.preventDefault();
    if (before) await before();
    scrollToSection(to);
  };
  return <a href={href} className={className} onClick={onClick} aria-label={label}>{children}</a>;
}
