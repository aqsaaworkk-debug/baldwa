// "Real work" section (RealWork.tsx): client-supplied photos from active sites and the project team.
// col: which column of the collage (1-3) · shape: frame proportion · kind: small label under the photo.

export type RealWorkItem = {
  kind: string;
  caption: string;
  src: string | null;
  alt: string;
  col: 1 | 2 | 3;
  shape: 'wide' | 'tall' | 'square';
};

export const REAL_WORK: RealWorkItem[] = [
  { kind: 'Construction', caption: 'Concrete slab work in progress at Virtual Binz', src: '/images/realwork/virtual-binz-site-01.webp', alt: 'Construction team working across a reinforced concrete slab at the Virtual Binz site', col: 1, shape: 'wide' },
  { kind: 'On site', caption: 'Site coordination during the slab pour at Virtual Binz', src: '/images/realwork/virtual-binz-site-02.webp', alt: 'Site coordination beside workers pouring a reinforced concrete slab at Virtual Binz', col: 1, shape: 'square' },
  { kind: 'Site supervision', caption: 'Supervision during structural construction', src: '/images/realwork/site-supervision.webp', alt: 'Site supervisor in a hard hat and safety vest in front of a building under construction', col: 2, shape: 'tall' },
  { kind: 'Project team', caption: 'The project team together on site', src: '/images/realwork/project-team-site.webp', alt: 'Five members of the project team standing together on an active construction site', col: 3, shape: 'wide' },
  { kind: 'Construction', caption: 'Concrete pour in progress at Gattani Residence', src: '/images/realwork/gattani-residence-site.webp', alt: 'Construction crew placing and levelling concrete across the reinforced slab at Gattani Residence', col: 3, shape: 'wide' },
];
