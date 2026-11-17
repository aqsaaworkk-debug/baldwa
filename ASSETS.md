# Assets: sources and licences

Record every asset that is not written in this repository here, with where it came from and its licence.

## Scroll journey

| Asset | Used for | Source | Licence |
| --- | --- | --- | --- |
| `public/images/journey/sky.webp`, `sky-small.webp` | Cloud layer of the no-WebGL fallback | `scene-01` from the client-supplied scroll prototype (`baldwa-website.zip`) | Supplied by the client. Origin and licence not stated in the prototype: to be confirmed before launch. |
| `public/images/journey/site.webp`, `site-small.webp` | Still for reduced motion, no-JS and the no-WebGL fallback | `scene-03` from the same prototype | Same as above: to be confirmed. |
| `public/images/journey/land.webp`, `cloud-deck.webp`, `cloud-bank.webp` | Photo opening over the live scene: land, dense cloud deck, cloud banks that part | Images supplied by the user in chat on 2026-11-16, converted to WebP; `cloud-bank` had its black background turned into transparency | Supplied by the client. Origin and licence to be confirmed before launch. |
| `public/video/opening-clouds.mp4`, `opening-site.mp4` | Film opening (USE_FILM in Journey.tsx): clouds parting to the plain, then the plot, the founder and the rising blueprint, scrubbed by scroll | Client clips `baldwa-immersive/assets/video/gemini_generated_video_9366a321.mp4` and `…_e0871e65.mp4`, copied unchanged (1280×720, 20 s and 10 s); only 0:13 onwards of the first is shown | Supplied by the client; Gemini-generated, both carry a small sparkle mark at the bottom right. Usage rights to be confirmed before launch. |
| `public/images/journey/plot.webp` | Reduced-motion still for the film opening | Frame at 0:01 of `opening-site.mp4` | As above. |
| `public/images/plan/second-floor.webp` | Floor and furniture texture of the 3D floor plan in the walkthrough section | Rendered second-floor plan supplied by the user in chat on 2026-11-16, cropped to the building and enlarged 2× | Supplied by the client. Origin and licence to be confirmed before launch. |
| `public/video/founder.mp4` | The founder, keyed from green screen onto a plane in the 3D scene | Client-supplied clip `data2/Architect_walking_on_green_backg…_ac3ca6bf_1080p.mp4`, copied unchanged (1920×1080, about 10 s) | Supplied by the client. The frame carries a small sparkle mark at the bottom right, which usually marks AI-generated footage; only the middle of the frame is shown, so it is not visible. Origin and usage rights to be confirmed before launch. |

Nothing in the 3D scene is downloaded from a third party. Clouds, sky, ground, streets, houses, trees and the plot are generated in code (`src/lib/journey/`); the founder is the client's clip above.

## Fonts (npm packages, self-hosted)

| Font | Package | Licence |
| --- | --- | --- |
| Fraunces (headlines) | `@fontsource-variable/fraunces` 5.3.0 | SIL Open Font License 1.1 |
| Manrope (text) | `@fontsource-variable/manrope` | SIL Open Font License 1.1 |
| JetBrains Mono (labels) | `@fontsource/jetbrains-mono` | SIL Open Font License 1.1 |
| Archivo (logo wordmark) | `@fontsource/archivo` | SIL Open Font License 1.1 |
