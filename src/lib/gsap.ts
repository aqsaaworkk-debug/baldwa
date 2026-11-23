'use client';
// Single place to register GSAP plugins. Import gsap / ScrollTrigger / useGSAP from here.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Call after a section changes the page's height outside a ScrollTrigger refresh (e.g. a lazily set-up section adding its
// tall scroll track). Every trigger further down measured its start before that change and would fire in the wrong place
// (the Philosophy pin showing over the Why film, the page tone changing early). Calls within one frame share one refresh.
let relayoutFrame = 0;
export function relayout() {
  if (typeof window === 'undefined' || relayoutFrame) return;
  relayoutFrame = requestAnimationFrame(() => {
    relayoutFrame = 0;
    ScrollTrigger.sort(); // refresh in page order, not creation order (lazy sections create theirs late)
    ScrollTrigger.refresh();
  });
}

export { gsap, ScrollTrigger, useGSAP };
