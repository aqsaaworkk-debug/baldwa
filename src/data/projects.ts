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
    name: 'Poolside Villa',
    type: 'Villa · Landscape & pool',
    location: '[Location]',
    text: 'A two-storey villa opening onto a lawn and a shaped pool, with a sunken lounge set into the water, a shaded cabana and sun loungers along the deck.',
    image: '/images/projects/poolside-villa.jpg',
    scene: 'sunfold',
    tod: 'golden',
  },
  {
    name: 'Three-storey Residence',
    type: 'Family home · Exterior',
    location: '[Location]',
    text: 'Stepped volumes with deep overhangs, a stone-clad entrance, a perforated jaali screen and glass balconies on every floor, framed by a planted front garden.',
    image: '/images/projects/residence-exterior.jpg',
    scene: 'courtyard',
    tod: 'day',
  },
  {
    name: 'Arched Living Room',
    type: 'Interior · Living & dining',
    location: '[Location]',
    text: 'Curved seating around a sculpted timber table, arched openings and soft wall lighting, flowing into a dining area that opens to the terrace.',
    image: '/images/projects/living-dining.jpg',
    scene: 'pavilion',
    tod: 'dusk',
  },
  {
    name: 'Formal Dining Room',
    type: 'Interior · Dining',
    location: '[Location]',
    text: 'A long marble table under a brass chandelier, with carved relief panels on a sage wall, inlaid stone floors and a full-height timber cabinet.',
    image: '/images/projects/dining-room.jpg',
    scene: 'terraces',
    tod: 'morning',
  },
  {
    name: 'Classic Bedroom',
    type: 'Interior · Bedroom',
    location: '[Location]',
    text: 'A tufted bed with gilded detailing, carved timber doors and wardrobe, patterned floor tiles and a coffered ceiling with a brass chandelier.',
    image: '/images/projects/classic-bedroom.jpg',
    scene: 'stepwell',
    tod: 'noon',
  },
  {
    name: 'Jaali Master Bedroom',
    type: 'Interior · Bedroom',
    location: '[Location]',
    text: 'A timber jaali wall and coffered wooden ceiling frame a leather bed, with a lit bar niche and a quiet seating corner by the window.',
    image: '/images/projects/jaali-bedroom.jpg',
    scene: 'studio',
    tod: 'dusk2',
  },
];

// The hero shows this scene live (slow drift + mouse parallax).
export const heroScene: { scene: SceneKey; tod: TodKey } = { scene: 'sunfold', tod: 'golden' };
