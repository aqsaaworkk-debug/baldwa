// Film version of the opening, staged after the reference reel (reference videos/sky.mp4):
// a hero title over clouds, a fast dive through the clouds, then one continuous drone glide
// (forward, tilting down so the horizon leaves the top of the frame, a slight turn).
// Same rule as the 3D journey: everything is a pure function of journey.p.
//
//   hero   title over the first frame of clip A (clouds)
//   part   fast: the title goes, clip A runs its cloud dispersal
//   drone  the camera move over the land (transforms on clip A, see droneAt), then a push-in
//          and dissolve to clip B (no clouds in between)
//   site   clip B, whole (the plot by the road, the founder walks in, the blueprint rises)
import { clamp, lerp, range } from './stages';

// The client's full hero film: one clip, scrubbed by scroll across the whole opening (title over its first frames).
// Put the file in public/videos and set it here, e.g. { src: '/videos/hero.mp4', screens: 4 } (screens = scroll length).
// While it is null, the two-clip opening below is used. Encode it with frequent keyframes so scrubbing stays smooth.
// Client hero film (client, 2026-11-23: "baldwa hero.webm", 23.6 s, 4K: clouds, the land, the model on a desk), re-encoded
// for scrubbing: 1280 px, 30 fps, a keyframe every 10 frames, no audio, faststart, with the generator marks in the
// bottom-right corner removed. poster = its first frame. (The earlier film was "BALDWA VIDEO (1).mp4".)
// Full length (23.58 s, not trimmed). The generator marks in the bottom-right corner ("Veo" label, and the sparkle that
// appears in the last half-second) are filled in with ffmpeg removelogo.
export const HERO_FILM = { src: '/videos/hero.mp4', poster: '/images/hero-poster.jpg', screens: 9 } as { src: string; poster: string; screens: number } | null;

// Cloud opening of the hero film (client, 2026-11-23: "cloud dispersal on scroll like before", i.e. like the earlier film,
// which opened fully clouded and parted as you scrolled). Photo clouds cover the first frame and part on scroll while the film
// dives through its own clouds. All in master progress p; the film's first `cloudTime` seconds (sky, clouds, the dive to the
// land) are spread over the first `film` of p so they aren't over in a flick, the rest plays on evenly.
export const HERO_CLOUDS = { part: [.02, .17], film: .2, cloudTime: 3 } as const;

export const CLIPS = {
  a: { src: '/video/opening-clouds.mp4', from: 13, to: 20 },  // client clip gemini_generated_video_9366a321, first 13 s unused
  b: { src: '/video/opening-site.mp4', from: 0, to: 10 },     // client clip gemini_generated_video_e0871e65, whole
};

const SEGMENTS = [
  { id: 'hero', screens: .6 },
  { id: 'part', screens: .55 },
  { id: 'drone', screens: 1.7 },
  { id: 'site', screens: 3.2 },
] as const;

export type FilmStage = (typeof SEGMENTS)[number]['id'];

export const FILM_SCREENS = SEGMENTS.reduce((n, s) => n + s.screens, 0);

const SPAN = {} as Record<FilmStage, [number, number]>;
{
  let acc = 0;
  for (const s of SEGMENTS) { SPAN[s.id] = [acc / FILM_SCREENS, (acc + s.screens) / FILM_SCREENS]; acc += s.screens; }
}
export const filmAt = (id: FilmStage, t = 0) => lerp(SPAN[id][0], SPAN[id][1], t);
export const filmT = (id: FilmStage, p: number) => range(p, SPAN[id][0], SPAN[id][1]);

// Stage-local timings
export const PART = { title: [0, .3], clouds: [0, .75], clipTo: 16 };  // clip A reaches 0:16 (sky clear) as the part ends
export const JOIN = { push: [.72, 1], cover: [.8, 1], swap: filmAt('site', 0), clear: [0, .14], settle: [0, .3] };
// push / cover: 'drone'-local, the camera pushes in and clip B dissolves in over clip A; settle: 'site'-local, B eases forward

const easeInOut = (t: number) => { const x = clamp(t); return -(Math.cos(Math.PI * x) - 1) / 2; };

// The drone move, as transforms on clip A. Zooming in about a point low in the frame pushes the
// horizon (a third of the way down) up and out of the top, which reads as the camera tilting
// down while it glides forward; the turn and the sideways drift are small, as in the reference.
export const DRONE = { scale: .55, origin: '50% 85%', turn: 3, drift: -2.5 };
export function droneAt(p: number) {
  const t = easeInOut(range(filmT('drone', p), 0, .9)), push = range(filmT('drone', p), JOIN.push[0], JOIN.push[1]);
  return { scale: 1 + DRONE.scale * t + .4 * push * push, rotation: DRONE.turn * t, xPercent: DRONE.drift * t };
}

export function clipTimes(p: number) {
  const part = filmT('part', p), drone = filmT('drone', p), site = filmT('site', p);
  return {
    a: part < 1 ? lerp(CLIPS.a.from, PART.clipTo, part) : lerp(PART.clipTo, CLIPS.a.to, range(drone, 0, .9)),
    b: lerp(CLIPS.b.from, CLIPS.b.to, site),
    showB: p >= JOIN.swap,
  };
}

// The first chapter is the hero title itself (no card in film mode, see journey.css).
export const FILM_CHAPTERS = [
  { id: 'sky', label: 'Sky', kicker: 'Baldwa & Associates', title: 'Architecture and interior design solutions in Udaipur', detail: 'Architecture, BIM engineering and interior design.', show: [0, filmAt('part', .25)], goto: 0 },
  { id: 'site', label: 'Site', kicker: 'Baldwa & Associates · Udaipur', title: 'Architecture, BIM engineering and interior design', detail: 'A cross-functional architecture and design organisation based in Udaipur, Rajasthan.', show: [filmAt('site', .12), filmAt('site', .3)], goto: filmAt('site', .1) },
] as const;
