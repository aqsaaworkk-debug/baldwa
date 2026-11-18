'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { projects } from '@/data/projects';
import { hasWebGL } from '@/lib/dom';

// Shares one image per project: the real photo from projects.ts, or a 3D render made in the
// browser once the page has loaded. Used by the carousel and the menu.
const Ctx = createContext<(string | null)[]>(projects.map((p) => p.image));
export const useProjectImages = () => useContext(Ctx);

export default function ProjectImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<(string | null)[]>(() => projects.map((p) => p.image));

  useEffect(() => {
    // Most production projects have real photos. Check that first so we do not create a throwaway
    // WebGL context during startup merely to discover that no procedural stills are needed.
    if (projects.every((p) => p.image) || !hasWebGL()) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    import('@/lib/three/renderStills').then(({ renderStills }) => {
      if (cancelled) return;
      stop = renderStills(projects, (i, url) => setImages((prev) => prev.map((v, k) => (k === i ? url : v))));
    });
    return () => { cancelled = true; stop?.(); };
  }, []);

  return <Ctx.Provider value={images}>{children}</Ctx.Provider>;
}
