# Baldwa website: notes for AI agents

## What this is
Single-page marketing site for Baldwa, an architecture and interiors studio.
Stack: Next.js 16 App Router + TypeScript, React 19, React Three Fiber 9 + drei, three.js 0.186, GSAP 3 (ScrollTrigger, @gsap/react).

## Commands
- `npm run dev` (http://localhost:3000)
- `npm run build` must pass (it also type-checks) before you finish a task.

## Content and SEO (client brief "Baldwa project.pdf", 2026-11-17)
- All copy and SEO for the site lives in `src/data/site.ts` (homepage, About, five service pages, FAQ, structured data). Use the brief's wording as supplied; only obvious typos were fixed. Don't invent claims, numbers or contact details.
- Pages: `/` (homepage), `/about`, `/projects`, `/services`, `/contact`. The five service pages (`/services/[slug]`) were removed on request (2026-11-21); their content is on the Services page, and `next.config.ts` redirects the old addresses to the right tab.
- Service groups (client, 2026-11-21): `SERVICE_GROUPS` in `site.ts`, in this order: 1 PMC and Construction Management (`#pmc`), 2 Architecture, Interior Design and Consultancy (`#design`), 3 BIM Engineering (`#bim`). Homepage notebook (`Philosophy.tsx`): pages numbered 01 left, 02 centre, 03 right, opening left, then right, then the centre fills in; each page links to its tab. Services page (`ServiceCards.tsx` + `services.css`): tabs styled exactly like the Projects page categories (`project-filters`); the open tab shows each of its services in full (h1, body, photo) on wide curved cards that swing in from alternating sides. The tab follows the URL hash; `servicePath()` and `groupPath()` return tab links.
- One H1 per page. Homepage H1 is the hero title (Journey.tsx); hero caption cards are not headings.
- Navigation: the menu lists four pages only (client, 2026-11-21): About Us, Projects, Services, Contact Us (`PAGE_LINKS` in `site.ts`), plus "Start a project" (`/#contact`). The individual services are reached from the Services page. The old section links were removed on request; don't add them back. `NavLink` goes to the homepage section from any page.
- The logo intro runs on the homepage only, and is skipped when the homepage is opened at a section (`/#contact`).

## Where things live
- Page: `src/app/page.tsx` lists sections in order; each section is a component in `src/components/`.
- Content data: `src/data/projects.ts` (featured projects + hero scene), `src/data/villa.ts` (interactive plan).
- Featured projects (client, 2026-11-20, after `From Klickpin.com- 25 Dreamy garden wedding decor ….gif`; an earlier vertical-reel version was rejected): `Projects.tsx` pins and shows a horizontal accordion of tall rounded photo panels. One is open wide, the rest are narrow pills with a number badge, and scrolling opens them left to right. Small screens get the same accordion stacked vertically; reduced motion gets a plain list. One scroll gesture moves exactly one project (client, 2026-11-21): a wheel/touch handler in `Projects.tsx` blocks native scrolling while the section is in view and glides one step per gesture (a gesture = wheel events with no gap over `QUIET` ms, or one touch); at the first or last project a gesture heading out scrolls the page on normally. Names only, no descriptions. One photo per project (the hover/flip second photo was removed on request). The background is `--cream` `#F6EEE1` (client asked for "a little bit creamy"), fading into almond at the section's edges.
- Why Baldwa background film: `public/videos/why.mp4` (client, 2026-11-21, from `VN20261121_105128.mp4`, 4K re-encoded to 1920 px H.264 CRF 28, no audio, faststart). `sukher-resort.mp4` is no longer used.
- 3D: R3F canvases in `src/components/three/`; scene builders and helpers in `src/lib/three/`.
- Styles: plain global CSS in `src/styles/`, imported in `src/app/layout.tsx`. Tokens in `base.css`; one file per section; all breakpoints in `responsive.css`.

## Rules
- Components using hooks, GSAP, R3F or browser APIs need `'use client'`. Load R3F canvases with `next/dynamic` and `ssr: false`.
- Import GSAP only from `@/lib/gsap` (plugins are registered there) and animate inside `useGSAP` with a `scope` so animations clean up.
- GSAP owns motion: do not add CSS transitions on properties GSAP animates (transform, opacity) for the same element.
- Respect reduced motion: check `prefersReducedMotion()` from `@/lib/dom` before adding animation.
- Use existing tokens (`--ink`, `--night`, `--paper`, `--surface`, `--fog`, `--gold`, `--gold-deep`, `--f-sans`). Palette (client, 2026-11-17): page background almond `#F2EDE7` (`--paper`) everywhere; light surfaces (cards, panels, pills, accents) sky grey `#B9BABD` (`--surface`, `--sky`); interactive states switch between ocean fog `#869192` (`--fog`, rest/hover) and navy `#2F4156` (`--ink`, selected/active); navy for type. Text on sky grey uses navy (`--ink`/`--ink-2`), not teal or `--gold-deep` (too faint). Accent `#F4B251` (`--gold`) only as light. No black. The logo keeps its own gold and orange. Ask before adding colours.
- The accent is too light for text on almond; use `--gold-deep` there.
- Page tone (client, 2026-11-17, after `reference videos/Screen Recording 2026-11-17 164329.mp4`): the canvas colour is `--page-bg`, scrubbed by `PageTone.tsx`: almond until Why Baldwa, blue smoke `#748795` (`--smoke`) as Brand Philosophy comes in, dark navy `#1C2836` (`--deep`) at the footer. Sections stay transparent so the change is seamless; text on the darker tones uses `html.tone-light`. The sun film lives in the footer.
- The header has no background at any scroll position. The menu is a full-screen almond overlay with the links centred.
- Colour scheme as it stands is approved: a strict five-colour recolour (gold removed, teal philosophy band, beige contact) was tried on 2026-11-17 and rejected by the client. Do not retry it.
- One typeface for everything: Bricolage Grotesque (variable, weight + optical size), token `--f-sans`; the old font tokens are aliases of it. Archivo is only the wordmark inside the logo. Do not add other fonts.
- The home page reads as one continuous almond (`--paper`) canvas (client, 2026-11-17): sections have no background colour of their own and no curves, rules or edges between them. Films and the 3D stage sit inside the canvas (rounded panels, soft fades). Keep it minimal: no decorative extras.
- Keep the page single-scroll: new content is a new `<section>` component plus its own CSS file, on the shared canvas.
- Layout must work at 390px wide with no horizontal scrolling.
- three.js uses physical light units: keep intensities multiplied by `Math.PI` as in `scenes.ts`. Colours are plain sRGB hex strings (three converts them).
- Text in square brackets (e.g. `[Phone number]`) is placeholder content. Never invent real-looking contact details, client names, awards or statistics; ask the user.
- Real project photos go in `public/images/` and are referenced from `src/data/projects.ts` via `image`.

## Scroll journey
- Hero film (client, 2026-11-17): `HERO_FILM` in `src/lib/journey/film.ts` plays `public/videos/hero.mp4` (from `BALDWA VIDEO (1).mp4`), scrubbed by scroll over 9 screens. It was re-encoded for scrubbing (1280 px, 30 fps, keyframe every 10 frames, no audio, faststart); re-encode any replacement the same way. Setting `HERO_FILM` to null brings back the two-clip film below.
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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
