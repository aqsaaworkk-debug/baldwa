// "Real work" section (RealWork.tsx): photos from site, the founder and the people who build.
// PLACEHOLDERS: set `src` (a file in public/images/realwork/) and `alt` when the client sends the photos;
// text in [square brackets] is placeholder copy to replace, never to invent.
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
  { kind: 'Construction', caption: 'Concrete frame and brick walls going up on site', src: '/images/projects/residence-construction.webp', alt: 'Residence under construction: concrete frame, cantilevered slabs and brick walls on site', col: 1, shape: 'wide' },
  { kind: 'Craftsmen', caption: '[Caption]', src: null, alt: '', col: 1, shape: 'square' },
  { kind: 'Founder', caption: '[Founder name], founder', src: null, alt: '', col: 2, shape: 'tall' },
  { kind: 'On site', caption: '[Caption]', src: null, alt: '', col: 3, shape: 'tall' },
  { kind: 'Construction', caption: '[Caption]', src: null, alt: '', col: 3, shape: 'wide' },
];
