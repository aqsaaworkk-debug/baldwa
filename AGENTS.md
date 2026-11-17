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
- Use existing tokens (`--ink`, `--night`, `--gold`, `--gold-deep`, `--sun`, `--f-display`, `--f-body`, `--f-mono`). Palette (client, 2026-11-16): navy `#2F4156` (`--ink`, `--night`), teal `#567C8D` (`--teal`; `--mute` is a slightly darker teal for text), sky blue `#C8D9E6` (`--sky`), beige `#F5EFEB` (`--paper`), white, accent `#F4B251` (`--gold`). No black. The logo keeps its own gold and orange. Ask before adding colours.
- The accent is too light for text on white; use `--gold-deep` there.
- Colour scheme as it stands is approved: a strict five-colour recolour (gold removed, teal philosophy band, beige contact) was tried on 2026-11-17 and rejected by the client. Do not retry it.
- Headlines Instrument Serif, body Manrope, measurements and labels JetBrains Mono.
- Keep the page single-scroll: new content is a new `<section>` component plus its own CSS file.
- Layout must work at 390px wide with no horizontal scrolling.
- three.js uses physical light units: keep intensities multiplied by `Math.PI` as in `scenes.ts`. Colours are plain sRGB hex strings (three converts them).
- Text in square brackets (e.g. `[Phone number]`) is placeholder content. Never invent real-looking contact details, client names, awards or statistics; ask the user.
- Real project photos go in `public/images/` and are referenced from `src/data/projects.ts` via `image`.

## Scroll journey
- Right now the opening is the film version: `USE_FILM` in `Journey.tsx` scrubs two client clips (`src/lib/journey/film.ts`: segments, clip times, the drone move, the dissolve between the clips), staged after `reference videos/sky.mp4`: hero title over clouds, fast dive through them, one continuous drone glide. Setting it to false brings back the real-time 3D journey below, which is kept intact.
- One number drives it: `journey.p` (0 to 1), written only by the ScrollTrigger in `Journey.tsx`. The 3D world, the camera and the HTML overlays read it. Keep every state a pure function of `p` (no accumulated state), so scrolling back restores it.
- To add a stage: add it to `BUILT` in `stages.ts` with a length in screens, add camera keys with `at('stage', t)`, add its objects to the shared root in `world.ts` and set their state inside `update(p)`. Remove it from `PLANNED`.
- One hotel model must serve the blueprint, construction, finished and tabletop stages; build it once and vary materials and visibility by `p`.
- World units are metres; the plot centre is the origin and `+z` points to the road. Use `PLOT` and `ROAD` from `stages.ts`.
- Text and navigation stay in HTML (`CHAPTERS` in `stages.ts`). Reduced motion gets the still image; no WebGL gets the 2D reveal.
- No paid generators, paid APIs or generated video. Procedural geometry, shaders and freely licensed local assets only; record every downloaded asset in `ASSETS.md`.

## Interactive villa
- The section now shows the 3D floor plan built from the client's rendered plan image, staged after `reference videos/WhatsApp Video 2026-11-16 at 5.10.20 PM.mp4`: `src/data/floorplan.ts` (walls, furniture, rooms traced in image pixels), `src/lib/three/planModel.ts` (the image is the floor; furniture is raised and textured from it), `src/components/three/PlanScene.tsx` (lights, camera, opening sequence), `VillaPlan.tsx` (controls). The notes below describe the earlier sample model (`villa.ts`, `villaModel.ts`, `VillaScene.tsx`), which is no longer shown but still in the repo.
- Rooms are rectangles in feet on a 60 × 44 ft grid, north at z = 0. Walls are generated between rooms in `villaModel.ts`; door openings come from `doors` in `villa.ts`.
- Furniture is chosen by room `kind` in `furnish()` in `villaModel.ts`; add a `case` for a new kind.
- Room floor slabs are R3F meshes in `VillaScene.tsx` (hover/click); camera targets live in the shared `Controls` ref.
