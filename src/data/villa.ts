// Interactive villa plan data. SAMPLE DESIGN: replace with a real project's rooms.
//
// Units are feet. The plot grid is `width` ft (x, west→east) by `depth` ft (z, north→south),
// so north is at z = 0. Rooms on one floor must not overlap.
// kind  decides floor finish and furniture (see furnish() in src/lib/three/villaModel.ts)
// open  true for spaces without walls/roof (courtyard, verandah, terrace, balcony, void)

export type RoomKind =
  | 'kitchen' | 'dining' | 'court' | 'bed' | 'master' | 'puja' | 'stair' | 'living' | 'family'
  | 'bath' | 'mbath' | 'powder' | 'study' | 'nook' | 'foyer' | 'verandah' | 'pool' | 'void'
  | 'linen' | 'theatre' | 'dress' | 'balcony' | 'terrace';

export type Room = { id: string; name: string; x0: number; z0: number; x1: number; z1: number; kind: RoomKind; open: boolean };
export type FloorKey = 'ground' | 'first';

export const villa = { name: 'Sunfold Villa', type: 'Type A', facing: 'North', width: 60, depth: 44 };

const room = (id: string, name: string, x0: number, z0: number, x1: number, z1: number, kind: RoomKind, open = false): Room =>
  ({ id, name, x0, z0, x1, z1, kind, open });

export const floors: Record<FloorKey, Room[]> = {
  ground: [
    room('g-kit', 'Kitchen', 0, 0, 14, 14, 'kitchen'),
    room('g-din', 'Dining', 14, 0, 30, 14, 'dining'),
    room('g-crt', 'Courtyard', 30, 0, 42, 14, 'court', true),
    room('g-gbr', 'Guest bedroom', 42, 0, 60, 16, 'bed'),
    room('g-puj', 'Puja room', 0, 14, 8, 22, 'puja'),
    room('g-str', 'Staircase', 8, 14, 14, 30, 'stair'),
    room('g-liv', 'Living room', 14, 14, 42, 32, 'living'),
    room('g-gba', 'Guest bath', 42, 16, 52, 26, 'bath'),
    room('g-stu', 'Study', 52, 16, 60, 26, 'study'),
    room('g-pow', 'Powder room', 0, 22, 8, 30, 'powder'),
    room('g-foy', 'Foyer', 0, 30, 14, 44, 'foyer'),
    room('g-ver', 'Verandah', 14, 32, 42, 44, 'verandah', true),
    room('g-pol', 'Pool deck', 42, 26, 60, 44, 'pool', true),
  ],
  first: [
    room('f-br2', 'Bedroom 2', 0, 0, 14, 14, 'bed'),
    room('f-fam', 'Family lounge', 14, 0, 30, 14, 'family'),
    room('f-void', 'Courtyard void', 30, 0, 42, 14, 'void', true),
    room('f-mbr', 'Master bedroom', 42, 0, 60, 16, 'master'),
    room('f-ba2', 'Bath 2', 0, 14, 8, 22, 'bath'),
    room('f-str', 'Staircase', 8, 14, 14, 30, 'stair'),
    room('f-lin', 'Linen room', 0, 22, 8, 30, 'linen'),
    room('f-the', 'Home theatre', 14, 14, 34, 30, 'theatre'),
    room('f-nok', 'Reading nook', 34, 14, 42, 30, 'nook'),
    room('f-drs', 'Dress', 42, 16, 50, 24, 'dress'),
    room('f-mba', 'Master bath', 50, 16, 60, 24, 'mbath'),
    room('f-bal', 'Balcony', 42, 24, 60, 30, 'balcony', true),
    room('f-ter', 'Terrace', 0, 30, 42, 42, 'terrace', true),
  ],
};

// Door openings: [roomA, roomB, widthFt = 3]. 'out' = outside the building.
// Glass walls to open spaces get a 4 ft sliding opening automatically.
export const doors: Record<FloorKey, [string, string, number?][]> = {
  ground: [
    ['g-foy', 'g-str'], ['g-str', 'g-liv'], ['g-liv', 'g-din', 8], ['g-din', 'g-kit'],
    ['g-puj', 'g-str'], ['g-pow', 'g-foy'], ['g-gbr', 'g-gba'], ['g-foy', 'out', 4],
  ],
  first: [
    ['f-br2', 'f-ba2'], ['f-br2', 'f-fam'], ['f-fam', 'f-the', 6], ['f-str', 'f-the'],
    ['f-str', 'f-lin'], ['f-mbr', 'f-drs'], ['f-drs', 'f-mba'], ['f-the', 'f-nok'], ['f-drs', 'f-nok'],
  ],
};

export const ft = (n: number) => `${n}' 0"`;
export const roomDims = (r: Room) => (r.kind === 'void' ? 'Open to sky' : `${ft(r.x1 - r.x0)} × ${ft(r.z1 - r.z0)}`);
export const coveredArea = (rs: Room[]) => rs.filter((r) => !r.open).reduce((s, r) => s + (r.x1 - r.x0) * (r.z1 - r.z0), 0);
export const fmtArea = (n: number) => n.toLocaleString('en-IN');
