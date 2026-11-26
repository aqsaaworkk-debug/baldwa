// Featured-project cards that play a three-stage story on scroll (client, 2026-11-26):
// 1 blueprint -> 2 render (a soft wipe sweeps across, after the client's sketch-to-render reference) -> 3 the card dissolves
// and the design stands on the page as a 3D model. One entry per card, keyed by the bento area in Projects.tsx (a-i);
// only the content differs between cards.
//
// blueprint / render: the two drawings, cropped to the SAME frame around the object (same size, same position), so the
//   outline stays put while the wipe runs. paper: the drawings' sheet colour, shown around them in the card.
// model: a cut-out (transparent background) of the 3D view.

// The interactive 3D design opened by clicking the card's model (ModelViewer.tsx): built in code from the drawings
// (`wardrobe` and `bed`, src/lib/three/wardrobeModel.ts and bedModel.ts) or a GLB file from the client's 3D software in public/models/.
// Without it, the click opens the model picture, which tilts with the pointer.
export type Model3D = { kind: 'wardrobe' } | { kind: 'bed' } | { kind: 'glb'; src: string };

export type CardStages = {
  name?: string; // shown at the card's foot; leave out until the client gives one
  blueprint: string;
  render: string;
  model: string;
  paper: string;
  model3d?: Model3D;
  alt: { blueprint: string; render: string; model: string };
};

export const CARD_STAGES: Partial<Record<string, CardStages>> = {
  // client drawings "Wardrobe - 1": internal view, external view (PU finish shutters), isometric model
  b: {
    name: 'Wardrobe 1',
    blueprint: '/images/projects/stages/wardrobe-blueprint.webp',
    render: '/images/projects/stages/wardrobe-render.webp',
    model: '/images/projects/stages/wardrobe-model.webp',
    paper: '#e7e5da',
    model3d: { kind: 'wardrobe' },
    alt: {
      blueprint: 'Wardrobe 1, internal view drawing: shelves, hanging rods, accessory trays and pull-out drawers, with dimensions',
      render: 'Wardrobe 1, external view: arched PU finish shutters over fluted lower panels, with brushed metal handles',
      model: 'Wardrobe 1 as a 3D model: an L-shaped cream wardrobe with arched doors, fluted lower panels and brass handles',
    },
  },
  // client images (2026-11-26), told as site to finished room: aerial of the slab reinforcement, the structure going up,
  // then a furnished bedroom as the 3D model. Separate pictures (not one frame), so the wipe crossfades rather than aligns.
  c: {
    blueprint: '/images/projects/stages/site-slab.webp',
    render: '/images/projects/stages/site-structure.webp',
    model: '/images/projects/stages/site-bedroom-model.webp',
    paper: '#f2ede7',
    // model3d: { kind: 'glb', src: '/models/bedroom.glb' }, once the client sends the bedroom as a 3D file
    alt: {
      blueprint: 'Aerial view of a building slab with its steel reinforcement laid out and workers in hard hats on site',
      render: 'A house under construction, brick walls and concrete frame with timber formwork above, beside rolled drawings, a compass, a set square and a hard hat',
      model: 'A furnished bedroom shown as a cut-away 3D model: bed, lounge chairs, a study desk, shelving and a TV partition in warm wood and cream',
    },
  },
  // client drawings of a bed (2026-11-26): the front elevation and the render share one frame (aligned on the headboard),
  // so the wipe turns the drawing into the photo in place; stage 3 is the bed built in code from the drawings
  // (bedModel.ts, top plan for the depths), and its cut-out is a still of that model.
  h: {
    blueprint: '/images/projects/stages/bed-elevation.webp',
    render: '/images/projects/stages/bed-render.webp',
    model: '/images/projects/stages/bed-model.webp',
    paper: '#f2ede7',
    model3d: { kind: 'bed' },
    alt: {
      blueprint: 'Front elevation drawing of a bed: a 112 inch headboard with a slatted centre between cane panels, on bedside units, with dimensions',
      render: 'The bed rendered: dark slatted headboard with cane side panels and brass corner plates, white bedside units with walnut tops, cream bedding and a dark throw',
      model: 'The bed as a 3D model, seen from the front corner',
    },
  },
};
