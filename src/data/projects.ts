import type { SceneKey, TodKey } from '@/lib/three/scenes';

// Featured projects shown in the carousel.
// PLACEHOLDER CONTENT: replace names, types, locations and text with real projects.
//
// image:  path to a real photo in /public/images (e.g. '/images/sunfold.jpg').
//         When null, the site renders a 3D placeholder image from `scene`.
// scene:  procedural 3D scene in src/lib/three/scenes.ts (used when image is null).
// tod:    lighting preset for that scene.
// plan:   true shows the "Walk the plan" button linking to the interactive villa.

export type Project = {
  name: string;
  type: string;
  location: string;
  text: string;
  image: string | null;
  scene: SceneKey;
  tod: TodKey;
  plan?: boolean;
};

export const projects: Project[] = [
  {
    name: 'Sunfold Villa',
    type: 'Private residence',
    location: '[Location]',
    text: 'A two-storey villa whose upper floor folds out over a shaded pool terrace. Gold fins filter the low western sun into the living spaces.',
    image: null,
    scene: 'sunfold',
    tod: 'golden',
    plan: true,
  },
  {
    name: 'Courtyard House',
    type: 'Family home',
    location: '[Location]',
    text: 'Four sandstone wings around an open courtyard, with a rooftop chhatri and projecting windows that catch the breeze.',
    image: null,
    scene: 'courtyard',
    tod: 'day',
  },
  {
    name: 'Light Pavilion',
    type: 'Event pavilion',
    location: '[Location]',
    text: 'A single roof plane on slender columns, floating over a reflecting pool. At dusk the glass room glows like a lantern.',
    image: null,
    scene: 'pavilion',
    tod: 'dusk',
  },
  {
    name: 'Terrace Residences',
    type: 'Apartments',
    location: '[Location]',
    text: 'Eight floors shifted in plan so that every home gets a deep, shaded terrace with planting.',
    image: null,
    scene: 'terraces',
    tod: 'morning',
  },
  {
    name: 'Stepwell House',
    type: 'Residence & garden',
    location: '[Location]',
    text: 'Living spaces gathered around a sunken stepped court with water at its base, a modern take on the traditional stepwell.',
    image: null,
    scene: 'stepwell',
    tod: 'noon',
  },
  {
    name: 'Stone Studio',
    type: 'Workplace',
    location: '[Location]',
    text: 'A long sandstone building with deep vertical fins that cut glare while keeping the view open.',
    image: null,
    scene: 'studio',
    tod: 'dusk2',
  },
];

// The hero shows this scene live (slow drift + mouse parallax).
export const heroScene: { scene: SceneKey; tod: TodKey } = { scene: 'sunfold', tod: 'golden' };
