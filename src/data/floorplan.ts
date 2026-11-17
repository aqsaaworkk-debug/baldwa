// The second-floor plan of the walkthrough section, traced from the client's rendered plan
// (public/images/plan/second-floor.webp). Every number here is a pixel position in the ORIGINAL
// plan image (1191 × 1320), x to the right, y down. src/lib/three/planModel.ts turns them into
// a 3D model: the image is the floor, walls are raised from WALLS, and each furniture PIECE is
// raised to its height and textured from the image, so the model keeps the look of the plan.
//
// The image has no scale or room sizes, so none are shown. SCALE is an estimate (a double bed
// is about 2.1 m long) used only for proportions.

export const PLAN = {
  image: '/images/plan/second-floor.webp',
  crop: { x: 60, y: 60, w: 1071, h: 910 },   // part of the original image the texture holds
  centre: { x: 596, y: 516 },                 // world origin
  scale: 60,                                  // pixels per metre (estimate)
  wall: 1.8,                                  // walls are cut at this height (m) so rooms stay visible
  // outline of the floor slab, and the openings in it
  outline: [[85, 85], [1107, 85], [1107, 948], [127, 948], [127, 383], [85, 383]] as [number, number][],
  wells: [
    { x0: 138, y0: 389, x1: 304, y1: 649, depth: 2.6 },  // double-height void
    { x0: 566, y0: 661, x1: 694, y1: 893, depth: 2.1 },  // staircase
  ],
  stairs: { x0: 566, x1: 694, yTop: 893, tread: 21, steps: 11, rise: .17 }, // steps go down towards the north
};

type R = [x0: number, y0: number, x1: number, y1: number];

export const WALLS: R[] = [
  [85, 85, 617, 102], [722, 85, 1107, 102],                    // north (window over bath 2 between them)
  [85, 102, 103, 383],                                         // west
  [85, 366, 152, 383], [290, 366, 372, 383],                   // bedroom 1, south (window between)
  [430, 102, 445, 267], [430, 322, 445, 383],                  // bedroom 1 / bath 1
  [445, 367, 766, 383],                                        // south of the baths and wardrobes
  [600, 102, 615, 367],                                        // bath 1 / bath 2
  [445, 155, 505, 167], [445, 255, 470, 267], [533, 255, 600, 267], // bath 1
  [615, 197, 655, 206],                                        // bath 2
  [752, 102, 766, 210], [752, 260, 766, 383],                  // bath 2 / bedroom 2
  [828, 367, 1087, 383], [1068, 300, 1087, 367],               // bedroom 2, south and pier
  [1087, 102, 1107, 185], [1087, 300, 1107, 505], [1087, 545, 1107, 947], // east (two windows)
  [1070, 383, 1087, 462], [973, 460, 1087, 474],               // lobby
  [960, 437, 974, 660],                                        // lounge / bath 3
  [1022, 647, 1087, 660], [695, 647, 895, 660],                // bath 3 south, bedroom 3 north
  [695, 660, 712, 947],                                        // bedroom 3 west
  [545, 925, 829, 947], [997, 925, 1087, 947],                 // south (window between)
  [547, 782, 565, 925],                                        // stair
];

export const LIFT: R[] = [[432, 647, 565, 662], [432, 767, 565, 782], [432, 662, 447, 767], [550, 662, 565, 767]];

// [x0, y0, x1, y1, height]
export const GLASS: [number, number, number, number, number][] = [
  [617, 90, 722, 97, 1.8], [152, 371, 290, 378, 1.8], [1093, 185, 1100, 300, 1.8], [1093, 505, 1100, 545, 1.8], [829, 932, 997, 940, 1.8], // windows
  [505, 160, 600, 163, 1.6], [470, 259, 533, 262, 1.6], [974, 542, 1087, 545, 1.6],                                                          // shower screens
  [130, 388, 136, 650, 1], [305, 388, 311, 650, 1], [130, 650, 432, 656, 1], [127, 656, 133, 948, 1], [127, 942, 545, 948, 1],              // void and terrace railings
  [628, 675, 632, 890, .9],                                                                                                                   // stair rail
];

// Door leaves: hinge → free end
export const DOORS: [number, number, number, number][] = [
  [435, 270, 470, 309], [427, 375, 386, 332], [757, 212, 721, 245], [769, 376, 810, 332],
  [962, 386, 997, 422], [975, 655, 1010, 616], [897, 655, 927, 700], [958, 652, 928, 700],
];

export type Piece =
  | { t: 'box'; r: R; h: number; base?: number }
  | { t: 'cyl'; x: number; y: number; rad: number; h: number; base?: number }
  | { t: 'rbox'; x: number; y: number; w: number; d: number; rot: number; h: number };

const box = (x0: number, y0: number, x1: number, y1: number, h: number, base = 0): Piece => ({ t: 'box', r: [x0, y0, x1, y1], h, base });
const cyl = (x: number, y: number, rad: number, h: number, base = 0): Piece => ({ t: 'cyl', x, y, rad, h, base });

export const PIECES: Piece[] = [
  // bedroom 1
  box(107, 147, 237, 270, .5), box(109, 150, 140, 267, .14, .5), box(105, 113, 138, 148, .5), box(105, 270, 138, 305, .5),
  box(242, 158, 272, 263, .42), box(400, 118, 430, 260, .5), box(412, 143, 420, 210, .55, .5), box(104, 346, 365, 366, .45),
  // bath 1 and wardrobe 1
  box(565, 210, 600, 255, .85), box(460, 170, 485, 212, .42), cyl(565, 304, 16, .4), box(582, 270, 600, 335, 1), box(445, 337, 600, 367, 1.25),
  // bath 2 and wardrobe 2
  box(703, 163, 752, 210, .85), box(635, 102, 660, 143, .42), box(617, 206, 653, 335, 1.25), cyl(718, 300, 17, .4), box(735, 265, 752, 335, 1), box(617, 337, 752, 367, 1.25),
  // bedroom 2
  box(876, 105, 1003, 235, .5), box(880, 106, 1000, 136, .14, .5), box(848, 102, 876, 135, .5), box(1000, 102, 1028, 135, .5),
  box(885, 242, 990, 272, .42), box(848, 343, 1015, 367, .5), box(888, 357, 975, 363, .55, .5),
  // lounge
  box(497, 400, 692, 416, .75), box(497, 416, 692, 442, .42), box(497, 442, 540, 505, .42), box(680, 400, 692, 442, .6),
  box(572, 457, 650, 500, .35), box(700, 408, 725, 433, .45), cyl(718, 476, 23, .45), cyl(718, 541, 23, .45),
  box(336, 460, 398, 590, .45), cyl(333, 452, 4, 1.25), cyl(398, 452, 4, 1.25), cyl(333, 598, 4, 1.25), cyl(398, 598, 4, 1.25),
  box(329, 448, 402, 455, .07, 1.2), box(329, 595, 402, 602, .07, 1.2),
  // terrace
  box(215, 733, 328, 789, .45), box(222, 736, 322, 750, .22, .45), cyl(260, 832, 25, .4), { t: 'rbox', x: 182, y: 832, w: 42, d: 42, rot: .45, h: .45 },
  // bath 3
  box(975, 548, 1015, 590, .85), box(1037, 602, 1062, 645, .42),
  // bedroom 3
  box(712, 660, 895, 703, 1.25), box(719, 747, 857, 872, .5), box(721, 750, 752, 869, .14, .5), box(713, 711, 750, 746, .5), box(713, 875, 750, 910, .5),
  box(864, 760, 896, 864, .42), box(1052, 688, 1085, 825, .5), box(1071, 706, 1079, 808, .6, .5), box(1045, 825, 1085, 920, .75), cyl(1027, 850, 20, .4),
];

// [x, y, height of the surface the pot stands on]
export const PLANTS: [number, number, number][] = [
  [415, 112, .5], [414, 233, .5], [462, 125, 0], [713, 105, 0], [1050, 343, 0], [1068, 832, .75], [1068, 905, .75],
  [513, 412, .75], [712, 420, .45], [260, 832, .4], [1072, 515, 0],
];

// Bedside lamps (glowing globes) and the warm room lights of the evening look: [x, y, height, strength]
export const LAMPS: [number, number][] = [[121, 130], [121, 288], [862, 117], [1014, 117], [731, 728], [731, 892]];
export const LIGHTS: [number, number, number, number][] = [
  [200, 215, 1.5, 1], [930, 200, 1.5, 1], [820, 810, 1.5, 1],            // bedrooms
  [560, 520, 1.9, 1.5], [840, 520, 1.9, 1.3],                            // lounge
  [525, 205, 1.6, .7], [685, 160, 1.6, .7], [1030, 570, 1.6, .7],        // baths
  [608, 300, 1.6, .7],                                                   // wardrobes
  [290, 800, 1.7, 1],                                                    // terrace
];

export type PlanRoom = { id: string; name: string; note: string; r: R };
export const ROOMS: PlanRoom[] = [
  { id: 'bed1', name: 'Bedroom 1', note: 'With bath and wardrobe', r: [104, 102, 430, 366] },
  { id: 'bath1', name: 'Bath 1', note: 'Attached', r: [445, 102, 600, 265] },
  { id: 'ward1', name: 'Wardrobe 1', note: 'Walk-in', r: [445, 267, 600, 367] },
  { id: 'bath2', name: 'Bath 2', note: 'Attached', r: [615, 102, 752, 197] },
  { id: 'ward2', name: 'Wardrobe 2', note: 'Walk-in', r: [615, 206, 752, 367] },
  { id: 'bed2', name: 'Bedroom 2', note: 'With bath and wardrobe', r: [766, 102, 1087, 367] },
  { id: 'lounge', name: 'Family lounge', note: 'Seating and swing', r: [312, 383, 960, 647] },
  { id: 'void', name: 'Double-height void', note: 'Open to below', r: [137, 388, 305, 650] },
  { id: 'terrace', name: 'Terrace lounge', note: 'Glass railing', r: [133, 656, 432, 942] },
  { id: 'lift', name: 'Lift', note: 'Passenger lift', r: [447, 662, 550, 767] },
  { id: 'stair', name: 'Staircase', note: 'To the floor below', r: [565, 660, 695, 925] },
  { id: 'lobby', name: 'Lobby', note: 'To bath 3', r: [974, 383, 1070, 460] },
  { id: 'bath3', name: 'Bath 3', note: 'Common', r: [974, 474, 1087, 647] },
  { id: 'bed3', name: 'Bedroom 3', note: 'With wardrobe', r: [712, 660, 1087, 925] },
];

export const PLAN_FACTS = { floor: 'Second floor', bedrooms: 3, baths: 3 };
