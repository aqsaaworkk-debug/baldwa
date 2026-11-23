// "Real work" section (RealWork.tsx): client-supplied photos from active sites and the project team, plus the site film.
// Order = grid order: the film is the large tile, photos 1 and 2 stack beside it, photos 3 to 5 run along the bottom.
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
];
