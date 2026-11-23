// Paper story (section after the hero film): every tweakable value in one place.
// The debug panel (press D on localhost, or add ?debug to the URL) edits this object live; "Copy values" prints the
// current start pose / shadow / roll as JSON so they can be pasted back here.
//
// Units: the paper is 1 unit tall in its own space (width = its image aspect). Stage lengths are in screens of scroll
// (1 = one viewport height), because the hero photo and the Projects section move by real screen distances.

import { BRAND } from '@/data/site';

export const PAPER = {
  // ---------- Stage timings (screens of scroll), in order; the hero stays pinned through all of these ----------
  // fadeIn: crossfade from the film's last frame to the still
  // lift:   the paper rises to the centre; the hero photo slides up half a screen, plain cream fills the lower half
  // settle: short hold before writing
  // write:  the heading, then the points, are written one by one (layout holds still: half hero, half cream)
  // pause:  short hold when all four are done
  // Then the hero is released (client, 2026-11-23): for one screen it scrolls away naturally with the paper on it, the paper
  // rolling up as it goes (fully rolled after `rollEnd` of that screen), while the Projects section comes up right behind
  // it and its projects slide in from the right. Nothing is moved by script vertically, so nothing can jitter.
  stages: { fadeIn: .25, lift: 1, settle: .2, write: 3.2, pause: .25 },
  rollEnd: .45,

  // How far the hero photo slides up during the lift (fraction of the screen); the cream panel under it fills the rest.
  heroShift: .5,
  // Projects heading and panels slide in from the right while the hero scrolls away: start offset (fraction of the screen
  // width), and when each slides, as [start, end] fractions of that screen. The starts are set so each stays off screen until
  // the hero and the paper have cleared the strip it comes into (panels: from ~0.3, heading: from ~0.41), so nothing overlaps.
  projectsFrom: 1.1,
  projectsSlide: { panels: [.05, .8] as [number, number], heading: [.18, .85] as [number, number] },

  // Inside each point's share of `write`: the text writes over this first part, then a short hold before the next point.
  writeSplit: .85,

  // Starting pose: exactly where the film's own sheet lies on the table in its last frame (fitted to its four corners), so the
  // film's sheet becomes this one at the handoff. Re-fit if the hero film changes.
  // u / v: where the paper's centre sits on the background image (0..1 of the image, so it stays on the same spot of the table
  // whatever the screen shape). z: depth (camera is at z = 10; larger z is nearer). rotation in radians (x tilts it back onto
  // the table). scale: paper height as a fraction of the image's on-screen height.
  start: { u: .61, v: .8, z: 5.464, rotX: -1.447, rotY: .013, rotZ: -.812, scale: .415 },

  // Centred pose: paper height as a fraction of the viewport height.
  center: { height: .82, arc: .6 }, // arc: how far it swings towards the camera mid-lift (world units)

  // Bend while rising: comes in early in the lift and eases out as the paper settles (local units).
  bend: .07,

  // Shadow on the table. Two soft blobs: a tight contact shadow while the paper lies flat, and a wide soft one that takes
  // over as it rises, drifting farther towards the bottom left (away from the lamp) and fading.
  // offset: towards bottom left at rest; drift: extra offset at full lift (paper units on the table plane).
  shadow: { opacity: .78, offsetX: -.05, offsetY: -.045, driftX: -.32, driftY: -.26, grow: 1.4, fade: .9, contactSpread: 1.08, softSpread: 1.5 },

  // Lamp (top right): warm tint multiplied into the paper, faint highlight on its right side, light strengths (× π).
  // tint: makes the lit paper come out as the Projects background (--cream #F6EEE1) so it blends in (client, 2026-11-23)
  light: { tint: '#fefff9', highlight: .04, ambient: .8, lamp: .32, lampColor: '#fffaf2' },

  // Background while the paper is up: amount of the pre-blurred frame (table-frame-blur.jpg) mixed in, and dim.
  backdrop: { blur: .85, dim: .28 },

  // Roll (vertex shader, uniform uRoll 0..1 driven by scroll). radius: starting tube radius; gap: added per turn so the
  // spiral grows and never cuts through itself; taper: slightly conical, like a hand-rolled sheet; shade: contact shadow
  // the tube casts on the flat sheet and darkening of the inner turns.
  // tilt / yaw: the sheet leans back and turns a little while rolling (radians), so the tube is seen in perspective.
  roll: { radius: .042, gap: .012, taper: .06, shade: .42, tilt: -.38, yaw: .3 },

  // Soft shadow the floating sheet casts on the page behind it (bottom left, away from the lamp). It follows the sheet as it
  // rolls up. offset: paper units; depth: how far behind the sheet; spread: softness.
  drop: { opacity: .34, offsetX: -.035, offsetY: -.05, depth: .12, spread: 1.32 },

  // Writing on the paper (drawn on a canvas texture, so it rolls up with it), in this order: the heading, then the points.
  // Heading and services: client, 2026-11-23 (the studio's name, then the services it provides).
  title: { text: BRAND.name, size: .062, y: .21, rule: { to: .86, alpha: .3 } }, // size: fraction of the paper width; y: baseline
  points: ['PMC & Construction Management', 'BIM Engineering', 'Architecture', 'Interior Consultancy'],
  numbered: true,
  text: {
    font: 'Josefin Sans Variable', weight: 400, size: .034, ink: '#2F4156', // points; size: fraction of the paper width (the site font, loaded in layout.tsx)
    x: .13, rows: [.39, .52, .65, .78], // left edge, and baseline of each point, fractions of the paper (landscape sheet)
    feather: .06, // soft edge of the left-to-right reveal, fraction of the line width
    rule: { to: .7, below: .028, alpha: .2 }, // faint pencil rule under each point: right end and offset below the baseline (fractions of the paper), opacity
  },
  // One sticker on the paper from the start, at its end (bottom right). x / y: its centre, fractions of the paper;
  // size: fraction of the paper width; rotate: angle (radians).
  sticker: { x: .84, y: .73, size: .16, rotate: -.14 },

  assets: {
    frame: '/images/paper/table-frame.jpg', // last frame of the hero film (23.5 s), its sheet patched out (this 3D sheet replaces it)
    frameBlur: '/images/paper/table-frame-blur.jpg',
    frameSize: [1920, 1080] as [number, number],
    paper: '/images/paper/paper.webp',
    paperSize: [1448, 1086] as [number, number], // landscape blueprint sheet (client, 2026-11-23)
    sticker: '/images/paper/sticker.webp',
  },
};

export type PaperConfig = typeof PAPER;
