'use client';
import type { ReactNode, MouseEvent } from 'react';
import { scrollToSection } from '@/lib/dom';

// In-page link that smooth-scrolls to a section id. `before` runs first (e.g. close the menu)
// and may return a promise to wait for.
export default function NavLink({ to, className, children, label, before }: {
  to: string; className?: string; children: ReactNode; label?: string; before?: () => void | Promise<void>;
}) {
  const onClick = async (e: MouseEvent) => {
    e.preventDefault();
    if (before) await before();
    scrollToSection(to);
  };
  return <a href={`#${to}`} className={className} onClick={onClick} aria-label={label}>{children}</a>;
}
