# Baldwa website: notes for AI agents

## What this is
Single-page marketing site for Baldwa, an architecture and interiors studio.
Stack: Next.js 16 App Router + TypeScript, React 19, React Three Fiber 9 + drei, three.js 0.186, GSAP 3 (ScrollTrigger, @gsap/react).

## Commands
- `npm run dev` (http://localhost:3000)
- `npm run build` must pass (it also type-checks) before you finish a task.

## Where things live
- Page: `src/app/page.tsx` lists sections in order; each section is a component in `src/components/`.
- Content data: `src/data/projects.ts` (carousel + hero scene), `src/data/villa.ts` (interactive plan).
- 3D: R3F canvases in `src/components/three/`; scene builders and helpers in `src/lib/three/`.
- Styles: plain global CSS in `src/styles/`, imported in `src/app/layout.tsx`. Tokens in `base.css`; one file per section; all breakpoints in `responsive.css`.

## Rules
- Components using hooks, GSAP, R3F or browser APIs need `'use client'`. Load R3F canvases with `next/dynamic` and `ssr: false`.
- Import GSAP only from `@/lib/gsap` (plugins are registered there) and animate inside `useGSAP` with a `scope` so animations clean up.
- GSAP owns motion: do not add CSS transitions on properties GSAP animates (transform, opacity) for the same element.
- Respect reduced motion: check `prefersReducedMotion()` from `@/lib/dom` before adding animation.
- Use existing tokens (`--ink`, `--night`, `--gold`, `--gold-deep`, `--sun`, `--f-display`, `--f-body`, `--f-mono`). Palette is white / black / logo gold / logo orange; ask before adding colours.
- Gold is too light for text on white; use `--gold-deep` there.
- Headlines Instrument Serif, body Manrope, measurements and labels JetBrains Mono.
- Keep the page single-scroll: new content is a new `<section>` component plus its own CSS file.
- Layout must work at 390px wide with no horizontal scrolling.
- three.js uses physical light units: keep intensities multiplied by `Math.PI` as in `scenes.ts`. Colours are plain sRGB hex strings (three converts them).
- Text in square brackets (e.g. `[Phone number]`) is placeholder content. Never invent real-looking contact details, client names, awards or statistics; ask the user.
- Real project photos go in `public/images/` and are referenced from `src/data/projects.ts` via `image`.

## Interactive villa
- Rooms are rectangles in feet on a 60 × 44 ft grid, north at z = 0. Walls are generated between rooms in `villaModel.ts`; door openings come from `doors` in `villa.ts`.
- Furniture is chosen by room `kind` in `furnish()` in `villaModel.ts`; add a `case` for a new kind.
- Room floor slabs are R3F meshes in `VillaScene.tsx` (hover/click); camera targets live in the shared `Controls` ref.
