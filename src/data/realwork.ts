// "Real work" section (RealWork.tsx): client-supplied photos from active sites and the project team, plus the site film.
// Order = grid order: the film is the large tile, photos 1 and 2 stack beside it, the rest run three to a row below
// (RealWork.tsx widens the photos of a short last row so the grid ends square).
// kind: short label (alt text context, and the placeholder when a photo is missing) · focus: object-position for the crop.

export type RealWorkItem = {
  kind: string;
  src: string | null;
  alt: string;
  focus?: string;
};

// Site film (client, 2026-11-23, from "VBfinalEDITED (1).webm": Virtual Binz, drone shots of the site and the finished
// building). Re-encoded 960 x 540 H.264, no audio, faststart; the top band was cropped off the whole film to remove an
// editor watermark that showed in its first seconds.
export const REAL_WORK_VIDEO = {
  src: '/videos/real-work.mp4',
  poster: '/images/realwork/real-work-poster.jpg',
  label: 'Drone film of the Virtual Binz site: the slab pour, the structure going up, and the finished building',
};

export const REAL_WORK: RealWorkItem[] = [
  { kind: 'Construction', src: '/images/realwork/virtual-binz-site-01.webp', alt: 'Construction team working across a reinforced concrete slab at the Virtual Binz site' },
  { kind: 'On site', src: '/images/realwork/virtual-binz-site-02.webp', alt: 'Site coordination beside workers pouring a reinforced concrete slab at Virtual Binz' },
  { kind: 'Site supervision', src: '/images/realwork/site-supervision.webp', alt: 'Site supervisor in a hard hat and safety vest in front of a building under construction', focus: '50% 46%' },
  { kind: 'Project team', src: '/images/realwork/project-team-site.webp', alt: 'Five members of the project team standing together on an active construction site' },
  { kind: 'Construction', src: '/images/realwork/gattani-residence-site.webp', alt: 'Construction crew placing and levelling concrete across the reinforced slab at Gattani Residence' },
  // client, 2026-11-24
  { kind: 'Slab pour', src: '/images/realwork/slab-pour-drone.webp', alt: 'Drone view of a crew pouring and spreading concrete over a reinforced slab, with column bars standing up through it' },
  { kind: 'Foundation', src: '/images/realwork/raft-foundation-top.webp', alt: 'Top-down drone view of a raft foundation: reinforcement mesh laid across the whole excavated plot, edged with shuttering' },
  { kind: 'Interior design', src: '/images/realwork/bedroom-interior-render.webp', alt: 'Interior design rendering of a bedroom with a palm mural in an arched niche between fluted pilasters, a framed TV wall and a wing chair' },
  { kind: 'Structure', src: '/images/realwork/residence-structure.webp', alt: 'Residence under construction with brick walls, concrete columns and wide cantilevered roof slabs, upper floors still shuttered' },
  { kind: 'Excavation', src: '/images/realwork/basement-raft-aerial.webp', alt: 'Aerial view of an excavated basement with raft reinforcement, red shuttering along the walls and column bars rising from the mesh' },
];
