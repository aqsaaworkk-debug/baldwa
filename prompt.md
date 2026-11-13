# UI/UX Specification: Immersive 3D "Places We Have Shaped" Featured Projects Section

## 1. Overview & Concept
* **Goal**: Build an immersive, 3D-animated "Featured Projects" section inspired by the Dropbox Brand reference style (`https://brand.dropbox.com/`), tailored for a scroll-driven storytelling experience.
* **Core Interaction Flow**: 
  1. **Initial State**: The section opens with a hero card centered on screen displaying the heading **"Places We Have Shaped"** alongside a stunning, high-fidelity 3D house/architectural visual asset.
  2. **Scroll-Driven Shrinking**: As the user scrolls down, the central hero box smoothly shrinks down to a compact, docked sidebar card while remaining fully readable.
  3. **Grid Reveal & Hover Effects**: Concurrently, surrounding project cards emerge in a 3D perspective layout. Hovering over any project triggers a dynamic, responsive **shiny light / specular glint border effect** to highlight interactivity.
  4. **Click Interaction**: Clicking any project card triggers a smooth 3D depth transition to open the project details.

---

## 2. Technical Stack & Architecture
* **Framework**: React / HTML5 with Tailwind CSS for styling.
* **3D / Animation Engine**: Three.js / React Three Fiber (R3F) or Framer Motion for smooth scroll-linked depth transformations and 3D perspective tilts.
* **Styling & Effects**: Custom CSS shaders or Tailwind utility classes for the dynamic hover "shiny light" / glowing border effect.

---

## 3. Key Component Breakdown

### A. Hero Card ("Places We Have Shaped")
* **Initial State (`scroll_progress = 0`)**: 
  * Occupies center stage with a large, elevated 3D depth layer.
  * Displays the title **"Places We Have Shaped"** and a rich, interactive 3D house model/photo asset.
* **Transition State (`scroll_progress > 0`)**:
  * Smoothly scales down (e.g., from `scale(1)` to `scale(0.45)`) and glides to the left side of the viewport.
  * Typography and asset scale down proportionally to maintain complete legibility.

### B. Project Grid & Cards
* **Layout**: Positioned adjacent to the shrinking hero card in a dynamic 3D perspective grid.
* **Hover Effect ("Shiny Light")**:
  * Mouse-tracking radial gradient or dynamic pseudo-element border shimmer that follows cursor coordinates across the card surface, producing a metallic, luminous light sweep.
* **Click Action**: 
  * Triggers an immersive modal expansion or camera zoom-in transition into the selected project view.

---

## 4. Implementation Guidelines
1. **Performance**: Ensure smooth 60fps transitions by hardware-accelerating scale and transform properties (`will-change: transform`).
2. **Responsiveness**: Scale down layout parameters gracefully on tablet and mobile viewports, converting the pinned sticky scroll into a vertical stacking flow if necessary.