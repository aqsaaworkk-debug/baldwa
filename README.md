# Baldwa website

Single-page website for Baldwa (architecture & interiors): logo intro, live 3D hero, featured-projects carousel, interactive 3D villa plan, and Process, Why Baldwa, Brand philosophy and Contact sections.

**Stack:** Next.js 16 (App Router, TypeScript) · React 19 · React Three Fiber 9 + drei · three.js 0.186 · GSAP 3 (+ ScrollTrigger, @gsap/react)

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build (also type-checks)
npm start          # serve the production build
npm run typecheck  # TypeScript only
```

Deploys as-is to Vercel, or any Node host. The page is fully static, so you can also add `output: 'export'` in `next.config.ts` and upload the `out/` folder to static hosting.

## Project structure

```
src/
  app/
    layout.tsx            Fonts, global CSS, metadata, intro gate script
    page.tsx              The page: sections in order
    icon.png, apple-icon.png
  components/
    Intro.tsx             Logo builds in the centre, then flies into the header (GSAP)
    Header.tsx            Logo + menu button, full-screen menu (GSAP timeline)
    Hero.tsx              Hero frame + copy; loads three/HeroScene
    Projects.tsx          Featured projects stage (GSAP slide change + pointer parallax)
    VillaPlan.tsx         Interactive villa UI: views, floors, specs list; loads three/VillaScene
    Process.tsx           Exploded drawing-sheet stack (ScrollTrigger picks the active step)
    Why.tsx               Tilt cards (gsap.quickTo)
    Philosophy.tsx        Rising sun + word-by-word manifesto (ScrollTrigger scrub)
    Contact.tsx           Enquiry form (validation only, see below)
    Footer.tsx, Logo.tsx, NavLink.tsx
    ProjectImages.tsx     Shares project images (real photos or generated 3D stills)
    ScrollReveal.tsx      Slide-up on scroll for any element with class "rv"
    three/
      HeroScene.tsx       R3F canvas: procedural villa, camera drift + mouse parallax
      VillaScene.tsx      R3F canvas: ortho camera, room meshes with hover/click, drei <Html> labels
  data/
    projects.ts           Carousel projects + hero scene      ← edit content here
    villa.ts              Villa rooms, sizes, doors           ← edit the plan here
  lib/
    gsap.ts               Registers GSAP plugins; import gsap from here
    dom.ts                Reduced-motion, breakpoint, WebGL check, smooth scroll
    three/
      scenes.ts           Procedural buildings + lighting presets
      villaModel.ts       Villa walls (generated from rooms) + furniture
      renderStills.ts     Renders placeholder project images in the browser
  styles/
    base.css              Design tokens (colours, fonts) + shared type
    <section>.css         One file per section
    responsive.css        Breakpoints 1100px / 900px / 520px
public/
  brand/                  Original logo PNG + vector SVG
  images/                 Put real project photos here
```

## Replace placeholder content

Anything in square brackets, e.g. `[Phone number]`, is a placeholder and shows in gold monospace until replaced.

1. **Projects:** `src/data/projects.ts` (names, types, locations, text).
2. **Project photos:** put files in `public/images/` and set `image: '/images/your-photo.jpg'` on each project. Projects without a photo show a generated 3D render.
3. **Contact details:** `DETAILS` in `src/components/Contact.tsx`.
4. **Social links:** `SOCIAL` in `src/components/Header.tsx`.
5. **Villa plan:** `src/data/villa.ts` holds a sample villa. Replace it with a real project's rooms (feet, north at z = 0).
6. **Copy:** hero in `Hero.tsx`; steps in `Process.tsx`; cards in `Why.tsx`; manifesto and pillars in `Philosophy.tsx`.
7. **Enquiry form:** `Contact.tsx` validates but does not send. Add a route handler (`src/app/api/enquiry/route.ts`) or a form service at the `TODO`.

## Using real 3D models

The buildings are generated in code (`src/lib/three/scenes.ts`) so the site works without assets. To show a real project model, export a `.glb` from SketchUp / Revit / Blender into `public/models/`, then in `HeroScene.tsx` replace `<primitive object={c.root} />` with a component that uses drei's `useGLTF('/models/villa.glb')` (keep the lights and ground from `compose()` or add your own).

## Design system

CSS variables at the top of `src/styles/base.css`:

- Colours: white, black (`--ink`, `--night`), logo gold `#F5B21A`, sunrise orange `#EF5A12`
- Fonts (self-hosted via Fontsource): Instrument Serif (headlines), Manrope (text), JetBrains Mono (measurements/labels), Archivo (logo wordmark)

## Notes

- All motion respects the visitor's "reduce motion" setting.
- Without WebGL the 3D areas fall back to plain backgrounds and the room list still works.
- three.js uses physical light units, so light intensities in the scenes are multiplied by π.
- A `THREE.Clock` deprecation warning in the browser console comes from React Three Fiber itself and is harmless.
